import { promptForInputs, promptsForJason } from "../app/prompts"

const example = async () => {
    const defaults = {
        foo : {
            objects : [
                {
                    innerName : "",
                    innerAmount: 4.5
                }
            ]
        }
    }

    const prompts = promptsForJason(defaults)
    console.log(prompts.join("\n"))
    const data = await promptForInputs(prompts)
    console.log(JSON.stringify(data, null, 2))
}
export const onFillOutForm = async () => {

    const defaults = {
        foo : {
            bar : {
                flag : true,
            },
            num :123,
            percentage: 1.2,
            numbers: [1,2,3],
            objects : [
                {
                    innerName : "",
                    innerAmount: 4.5
                }
            ]
        }
    }
    const prompts = promptsForJason(defaults)
    console.log(prompts.map((p) => JSON.stringify(p, null, 2)).join("\n\n\n"))
    const data = await promptForInputs(prompts)
    console.log(JSON.stringify(data, null, 2))
}