import type { SessionPlan } from "../domain/types"
import type { NetworkGateway } from "./NetworkGateway"

export type MockResult = "succeed" | "fail" | "timeout"

export class MockNetworkGateway implements NetworkGateway {
  private result: MockResult = "succeed"
  private sent = new Set<string>()

  setResult(result: MockResult) {
    this.result = result
  }

  recordCount() {
    return this.sent.size
  }

  async send(_plan: SessionPlan, idempotencyKey: string) {
    if (this.sent.has(idempotencyKey)) return
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1200))
    if (this.result === "fail")
      throw new Error("No internet connection is available.")
    if (this.result === "timeout") await new Promise<void>(() => undefined)
    this.sent.add(idempotencyKey)
  }
}
