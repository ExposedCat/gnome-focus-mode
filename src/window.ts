export class Window {
  time = 0;
  private openedAt: number | null = null;

  constructor(
    public id: string,
    public name: string,
  ) {
    log(`[focus-mode][window] Window "${this.name}" created`);
  }

  open() {
    log(`[focus-mode][window] Window "${this.name}" opened`);
    this.openedAt = Date.now();
  }

  close() {
    const elapsed = Date.now() - this.openedAt!;
    this.openedAt = null;
    this.time += elapsed;
    log(`[focus-mode][window] Window "${this.name}" closed with diff ${elapsed}, total of ${this.time}`);
  }
}
