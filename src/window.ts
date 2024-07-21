export class Window {
  time = 0;
  private openedAt: number | null = null;

  constructor(
    public id: string,
    public name: string,
  ) {}

  open() {
    this.openedAt = Date.now();
  }

  close() {
    const elapsed = Date.now() - this.openedAt!;
    this.openedAt = null;
    this.time += elapsed;
  }
}
