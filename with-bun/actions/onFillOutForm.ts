import { promptForInputs, promptsForJason } from "../app/prompts"

export const onFillOutForm = async () => {

    const defaults = {
        foo : {
            bar : {
                flag : true,
            }
        }
    }
    const prompts = promptsForJason(defaults)
    console.log(prompts.join("\n"))
    const data = promptForInputs(prompts)
    console.log(JSON.stringify(data, null, 2))
}