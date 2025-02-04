import { text, select, confirm, isCancel } from "@clack/prompts"; 
// ^ or any similar prompt library in your Bun/TypeScript environment

//
// ------ TYPES -----
//
export type Prompt = {
  fieldName: string;            // e.g. "foo.bar.flag" or "foo.objects" or "foo.objects.innerName"
  userPrompt: string | null;    // e.g. "Foo -> Bar -> Flag"
  required: boolean;
  repeats: boolean;             // for arrays of primitives or array of objects
  defaultValue: string | null;
  options: string[] | null;
  typeHint: "string" | "int" | "float" | "boolean" | null;

  /**
   * If this prompt represents an "array of objects," we store
   * a set of 'subPrompts' for one "template" item. We'll prompt
   * repeatedly to build an array of such objects.
   */
  subPrompts?: Prompt[] | null;
};

//
// ------ UTILITIES -----
//

/**
 * Convert a camelCase or PascalCase string into a human-readable string.
 * e.g. "firstName" -> "First Name", "userID" -> "User ID"
 */
export function asPrompt(fieldName: string): string {
  const spaced = fieldName.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Safely parse user input based on the provided type hint.
 * Throws an Error if the value cannot be parsed.
 */
function parseValue(
  input: string,
  typeHint: Prompt["typeHint"]
): string | number | boolean {
  switch (typeHint) {
    case "boolean": {
      const lower = input.trim().toLowerCase();
      if (lower === "true") return true;
      if (lower === "false") return false;
      throw new Error("Invalid boolean (must be 'true' or 'false').");
    }
    case "int": {
      const intVal = parseInt(input, 10);
      if (isNaN(intVal)) {
        throw new Error(`Invalid integer: ${input}`);
      }
      return intVal;
    }
    case "float": {
      const floatVal = parseFloat(input);
      if (isNaN(floatVal)) {
        throw new Error(`Invalid float: ${input}`);
      }
      return floatVal;
    }
    case "string":
    case null:
    default:
      // If no typeHint or "string", accept the raw input
      return input;
  }
}

/**
 * Helper to set a nested value in an object given a dot-delimited path.
 * E.g., setNestedValue(obj, "foo.bar.flag", true) creates:
 * {
 *   foo: {
 *     bar: {
 *       flag: true
 *     }
 *   }
 * }
 */
function setNestedValue(
  target: Record<string, any>,
  path: string,
  value: any
): void {
  const keys = path.split(".");
  let current: Record<string, any> = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof current[k] !== "object" || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }

  current[keys[keys.length - 1]] = value;
}

//
// ------ RECURSIVE PROMPTING -----
//

/**
 * askOnePrompt handles prompting for a single 'Prompt' object,
 * returning the user’s answer as a JS value (string/boolean/number) or array of values/objects,
 * depending on .repeats and .subPrompts.
 *
 * @param prompt - the definition for this field
 * @param prefix - an array of strings that represent higher-level context,
 *                 used to produce a "Foo -> Bar -> Bazz" display
 */
async function askOnePrompt(
  prompt: Prompt,
  prefix: string[]
): Promise<any> {
  // If subPrompts exist, that means this is "an array of objects."
  // We'll prompt repeatedly for those subPrompts to build an array.
  if (prompt.subPrompts && prompt.subPrompts.length > 0) {
    const allItems: any[] = [];
    let keepAdding = true;

    // For user messages, combine the prefix with any userPrompt we might have
    const label = prompt.userPrompt ?? asPrompt(prompt.fieldName);
    const fullPromptPrefix = [...prefix, label];  // e.g. [ "Foo", "Objects" ]

    while (keepAdding) {
      console.log(`\n--- Enter data for: ${fullPromptPrefix.join(" -> ")} ---`);
      // Recursively prompt for the subPrompts, passing a new prefix if desired.
      // We'll pass an *empty* prefix or something like `["Foo", "Objects"]` so sub-fields
      // don't end up with huge repeated paths. This is flexible:
      const subAnswers = await askPromptsRecursively(prompt.subPrompts, fullPromptPrefix);
      allItems.push(subAnswers);

      if (prompt.repeats) {
        const ok = await confirm({ message: "Add another item?" })
        keepAdding = !isCancel(ok) && ok;
      } else {
        // If not repeating, break
        keepAdding = false;
      }
    }

    return allItems;
  }

  // If repeats is true but subPrompts is empty/undefined, we have an array of primitives
  if (prompt.repeats) {
    const collected: any[] = [];
    let keepRepeating = true;

    while (keepRepeating) {
      const val = await askForSingleValue(prompt, prefix);
      collected.push(val);

      const wantsMore = await confirm({ message: "Add another?" });
      if (!wantsMore) {
        keepRepeating = false;
      }
    }

    return collected;
  }

  // Otherwise, it's a single value
  const singleVal = await askForSingleValue(prompt, prefix);
  return singleVal;
}

/**
 * askForSingleValue handles the case where we just prompt
 * the user for a single primitive value (string/boolean/float/int).
 */
async function askForSingleValue(
  prompt: Prompt,
  prefix: string[]
): Promise<string | number | boolean | undefined> {
  // Build the label from prefix + userPrompt
  const label = prompt.userPrompt ?? asPrompt(prompt.fieldName);
  const fullLabel = [...prefix, label].join(" -> ");

  while (true) {
    let rawInput: string | undefined = undefined;
    const hasOptions = prompt.options && prompt.options.length > 0;

    if (hasOptions) {
      // If we have options, we do a select prompt
      const optionObjects = prompt.options!.map((o) => ({
        label: o,
        value: o,
      }));

      rawInput = (await select({
        message: fullLabel,
        options: optionObjects,
      })) as string;

      if (!rawInput && prompt.defaultValue !== null) {
        rawInput = prompt.defaultValue;
      }
    } else {
      // Otherwise we do a text input
      const placeholder = prompt.defaultValue ?? undefined;
      rawInput = (await text({
        message: fullLabel,
        placeholder,
      })) as string;

      if ((rawInput === undefined || rawInput.trim() === "") && prompt.defaultValue !== null) {
        rawInput = prompt.defaultValue;
      }
    }

    // If it's required, ensure the user typed something (or there's a default)
    if (
      (rawInput === undefined || rawInput.trim() === "") &&
      prompt.required &&
      !prompt.defaultValue
    ) {
      // We'll loop again
      continue;
    }

    // Parse if present
    if (rawInput !== undefined) {
      try {
        return parseValue(rawInput, prompt.typeHint);
      } catch (err) {
        console.error((err as Error).message);
        // re-prompt
        continue;
      }
    } else {
      // If no input, might return undefined or default
      return undefined;
    }
  }
}

/**
 * askPromptsRecursively:
 *  - Takes an array of prompts, plus a prefix array.
 *  - For each prompt, calls askOnePrompt, then merges the result
 *    into a single returned object, respecting dot-delimited fieldName paths.
 */
async function askPromptsRecursively(
  prompts: Prompt[],
  prefix: string[]
): Promise<Record<string, any>> {
  // Start with an empty result
  let result: Record<string, any> = {};

  for (const prompt of prompts) {
    // Ask user for this prompt's data
    const value = await askOnePrompt(prompt, prefix);
    // Store the result in `result` at the dot-delimited path
    setNestedValue(result, prompt.fieldName, value);
  }

  return result;
}

/**
 * The main function: promptForInputs
 *  - Delegates to askPromptsRecursively, starting with an empty prefix.
 *  - Returns a nested object respecting the dot paths.
 */
export async function promptForInputs(
  prompts: Prompt[]
): Promise<Record<string, any>> {
  return await askPromptsRecursively(prompts, []);
}

//
// ------ BUILD PROMPTS (unchanged from prior example) -----
//

function isNonDefault(value: unknown): boolean {
  if (value === null) return false;
  if (value === 0) return false;
  if (value === "") return false;
  return true;
}

function guessTypeHint(value: unknown): Prompt["typeHint"] {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return Number.isInteger(value) ? "int" : "float";
    case "string":
      return "string";
    default:
      return null;
  }
}

/**
 * Recursively build an array of Prompts for a given object.
 * Now supports "arrays of objects" by generating 'subPrompts'.
 *
 * @param obj    The current portion of the JSON object
 * @param path   The list of keys leading to 'obj'
 *               (used to create dot-delimited fieldNames
 *               and "->"-delimited userPrompts if you want)
 */
function buildPrompts(obj: unknown, path: string[]): Prompt[] {
  const prompts: Prompt[] = [];

  if (Array.isArray(obj)) {
    // Check if the array items are objects or primitives
    const firstItem = obj[0];
    // If there's at least one item and it's an object (non-array),
    // we treat it as "array of objects"
    if (firstItem && typeof firstItem === "object" && !Array.isArray(firstItem)) {
      // Single Prompt with subPrompts describing that object
      const fieldName = path.join(".");
      const userPrompt = path.map(asPrompt).join(" -> ");

      const subPrompts = buildPrompts(firstItem, []);
      prompts.push({
        fieldName,
        userPrompt,
        required: false,
        repeats: true,
        defaultValue: null,
        options: null,
        typeHint: null,
        subPrompts,
      });
    } else {
      // Otherwise, array of primitives or empty
      let arrayTypeHint: Prompt["typeHint"] = null;
      const firstNonDefaultItem = obj.find(isNonDefault);
      if (firstNonDefaultItem !== undefined) {
        arrayTypeHint = guessTypeHint(firstNonDefaultItem);
      }

      const fieldName = path.join(".");
      const userPrompt = path.map(asPrompt).join(" -> ");

      prompts.push({
        fieldName,
        userPrompt,
        required: false, 
        repeats: true,
        defaultValue: null,
        options: null,
        typeHint: arrayTypeHint,
      });
    }
  } else if (obj !== null && typeof obj === "object") {
    // It's a nested object: we recurse over each key
    const record = obj as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      const nestedPrompts = buildPrompts(value, [...path, key]);
      prompts.push(...nestedPrompts);
    }
  } else {
    // It's a primitive or null
    const fieldName = path.join(".");
    const userPrompt = path.map(asPrompt).join(" -> ");

    let defaultValue: string | null = null;
    let typeHint: Prompt["typeHint"] = null;
    if (isNonDefault(obj)) {
      defaultValue = String(obj);
      typeHint = guessTypeHint(obj);
    }

    prompts.push({
      fieldName,
      userPrompt,
      required: false, 
      repeats: false,
      defaultValue,
      options: null,
      typeHint,
    });
  }

  return prompts;
}

export const promptsForJason = (exampleJson: unknown): Prompt[] => {
  return buildPrompts(exampleJson, []);
};
