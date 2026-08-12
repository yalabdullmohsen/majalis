/**
 * حساب كسري دقيق (Rational Arithmetic) بأعداد صحيحة كبيرة (BigInt) — لا Floating Point.
 * كل حصص المواريث في هذا المحرك تُمثَّل ككسور مبسَّطة، ولا تُحوَّل لعدد عشري إلا
 * في طبقة العرض النهائية (لغرض القيمة النقدية فقط)، مع بيان طريقة التقريب هناك.
 */

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a === 0n ? 1n : a;
}

export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let n = typeof num === "number" ? BigInt(num) : num;
    let d = typeof den === "number" ? BigInt(den) : den;
    if (d === 0n) throw new Error("Fraction: قاسم بصفر غير مسموح");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.num = n / g;
    this.den = d / g;
  }

  static fromInt(n: number | bigint): Fraction {
    return new Fraction(n, 1n);
  }

  static zero(): Fraction {
    return new Fraction(0n, 1n);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    if (other.num === 0n) throw new Error("Fraction: قسمة على صفر");
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  /** أصغر مضاعف مشترك لمقامَين — يُستخدَم لإيجاد "أصل المسألة". */
  static lcmDen(a: Fraction, b: Fraction): bigint {
    return (a.den * b.den) / gcd(a.den, b.den);
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  isPositive(): boolean {
    return this.num > 0n;
  }

  equals(other: Fraction): boolean {
    return this.num === other.num && this.den === other.den;
  }

  lessThan(other: Fraction): boolean {
    return this.num * other.den < other.num * this.den;
  }

  greaterThan(other: Fraction): boolean {
    return this.num * other.den > other.num * this.den;
  }

  compare(other: Fraction): -1 | 0 | 1 {
    const diff = this.num * other.den - other.num * this.den;
    if (diff < 0n) return -1;
    if (diff > 0n) return 1;
    return 0;
  }

  /** تمثيل عشري (للعرض النهائي فقط — لا يُستخدَم في أي حساب داخلي). */
  toDecimal(precision = 6): number {
    const scale = 10n ** BigInt(precision);
    const scaled = (this.num * scale) / this.den;
    return Number(scaled) / Number(scale);
  }

  toPercent(precision = 4): number {
    return this.mul(new Fraction(100n)).toDecimal(precision);
  }

  toString(): string {
    if (this.den === 1n) return this.num.toString();
    return `${this.num}/${this.den}`;
  }

  /** أبسط تمثيل نصي عربي للكسور الشائعة في الفرائض (النصف، الثلث، ...). */
  toArabicLabel(): string {
    const key = `${this.num}/${this.den}`;
    const known: Record<string, string> = {
      "1/2": "النصف",
      "1/4": "الربع",
      "1/8": "الثمن",
      "1/3": "الثلث",
      "2/3": "الثلثان",
      "1/6": "السدس",
      "5/6": "خمسة أسداس",
      "1/1": "الكل",
    };
    return known[key] ?? this.toString();
  }
}
