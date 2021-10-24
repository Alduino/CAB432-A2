// from https://stackoverflow.com/a/4467559
export default function modulo(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
}
