import type { FlueContext } from "@flue/runtime";

export const triggers = { webhook: true };

export default async function ({init, payload, env}: FlueContext) {
    const harness = await init({model: env.DEEPSEEK_MODEL});
    const session = await harness.session();

    // 返回纯文本对话响应
    const response = (await session.prompt(payload.text));
    return response;
}