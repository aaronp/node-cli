import { text, select, confirm } from "@clack/prompts"; 
// ^ or any similar prompt library in your Bun/TypeScript environment

export type Prompt = {
  fieldName: string;
  userPrompt: string | null;
  required: boolean;
  repeats: boolean;
  defaultValue: string | null;
  options: string[] | null;
  typeHint: "string" | "int" | "float" | "boolean" | null;
};

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
 * Prompt the user for values based on an array of Prompt definitions.
 * Returns an object whose keys are the fieldNames and values are the user inputs.
 */
export async function promptForInputs(
  prompts: Prompt[]
): Promise<Record<string, any>> {
  const answers: Record<string, any> = {};

  for (const prompt of prompts) {
    const question = prompt.userPrompt ?? asPrompt(prompt.fieldName);
    const hasOptions = prompt.options && prompt.options.length > 0;

    // We'll accumulate values in an array if `repeats` is true.
    // Otherwise, we'll just store the single value.
    const collectedValues: any[] = [];

    let keepRepeating = true;
    while (keepRepeating) {
      let rawInput: string | undefined = undefined;

      // 1) If `options` is non-empty, let the user pick from a list:
      if (hasOptions) {
        // Convert prompt.options to clack's select "options" format
        const optionObjects = prompt.options!.map((o) => ({
          label: o,
          value: o,
        }));

        rawInput = (await select({
          message: question,
          options: optionObjects,
          // In Clack, there's no direct concept of a "defaultValue" for select prompts,
          // so you might handle that logic yourself, or rely on an added "None" or "Skip" option.
        })) as string;

        // If user canceled or didn't pick anything (depending on the library's behavior)
        if (!rawInput) {
          if (prompt.defaultValue !== null) {
            rawInput = prompt.defaultValue; // Use default if available
          }
        }
      } else {
        // 2) Otherwise, prompt for free-text input:
        const placeholder = prompt.defaultValue ?? undefined;
        rawInput = (await text({
          message: question,
          placeholder,
        })) as string;

        // If the user just pressed enter with no input
        if ((rawInput === undefined || rawInput.trim() === "") && prompt.defaultValue !== null) {
          // Use the default if provided
          rawInput = prompt.defaultValue;
        }
      }

      // If no input after all that and it's required (without default), re-prompt:
      if ((rawInput === undefined || rawInput.trim() === "") && prompt.required && !prompt.defaultValue) {
        // Loop again to ask the user
        continue;
      }

      // 3) Parse the raw input based on typeHint (if provided):
      if (rawInput === undefined) {
        // At this point, rawInput is not required or was set to defaultValue,
        // so we can store undefined or default if needed.
        collectedValues.push(undefined);
      } else {
        try {
          const parsed = parseValue(rawInput, prompt.typeHint);
          collectedValues.push(parsed);
        } catch (err) {
          // If parse fails, re-prompt:
          console.error((err as Error).message);
          continue;
        }
      }

      // 4) If repeats is false, we're done collecting for this field:
      if (!prompt.repeats) {
        keepRepeating = false;
      } else {
        // Ask user if they want to add more values
        const wantsMore = await confirm({
          message: "Add another?",
        });
        if (!wantsMore) {
          keepRepeating = false;
        }
      }
    }

    // 5) If `repeats` is true, store an array of all collected values; otherwise, store the first.
    answers[prompt.fieldName] = prompt.repeats ? collectedValues : collectedValues[0];
  }

  return answers;
}



/**
 * Returns true if a value is considered "non-default."
 * We treat null, 0, and "" as defaults, so they skip
 * setting type hints / defaultValue.
 */
function isNonDefault(value: unknown): boolean {
  if (value === null) return false;
  if (value === 0) return false;
  if (value === "") return false;
  return true;
}

/**
 * Guess the "typeHint" for a simple primitive value.
 * (For arrays, we'll treat the items' type similarly.)
 */
function guessTypeHint(value: unknown): Prompt["typeHint"] {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      // We can't reliably distinguish int vs float,
      // but let's do a basic check:
      return Number.isInteger(value) ? "int" : "float";
    case "string":
      return "string";
    default:
      return null;
  }
}

/**
 * Recursively build an array of Prompts for a given object.
 * @param obj    The current portion of the JSON object
 * @param path   The list of keys leading to 'obj'
 *               (used to create dot-delimited fieldNames
 *               and "->"-delimited userPrompts)
 */
function buildPrompts(obj: unknown, path: string[]): Prompt[] {
  const prompts: Prompt[] = [];

  if (Array.isArray(obj)) {
    // For arrays, we let the user repeat inputs. 
    // We'll base the type on the first non-default item if available.
    let arrayTypeHint: Prompt["typeHint"] = null;
    const firstNonDefaultItem = obj.find(isNonDefault);
    if (firstNonDefaultItem !== undefined) {
      arrayTypeHint = guessTypeHint(firstNonDefaultItem);
    }

    // The dot-delimited path for fieldName:
    const fieldName = path.join(".");
    // The "->"-delimited path for userPrompt:
    const userPrompt = path.map(asPrompt).join(" -> ");

    prompts.push({
      fieldName,
      userPrompt,
      required: false, // Or your desired rule
      repeats: true,
      defaultValue: null,
      options: null,
      typeHint: arrayTypeHint,
    });
  }
  else if (obj !== null && typeof obj === "object") {
    // It's a nested object: we recurse over each key
    const record = obj as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      // Recurse deeper with path extended by `key`
      const nestedPrompts = buildPrompts(value, [...path, key]);
      prompts.push(...nestedPrompts);
    }
  }
  else {
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
      required: false, // or your logic for "required"
      repeats: false,
      defaultValue,
      options: null,
      typeHint,
    });
  }

  return prompts;
}


/**
 * Main function: Create Prompt[] from an arbitrary nested JSON object.
 */
export const promptsForJason = (exampleJson: unknown) : Prompt[] => {
    // Start recursion at the root, with an empty path
    return buildPrompts(exampleJson, []);
  }
  