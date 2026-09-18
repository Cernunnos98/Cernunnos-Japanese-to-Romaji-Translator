# Unicode data attribution

CJ2R uses the Unicode Ideographic Variation Database and Unicode character-normalisation model as reference/data evidence for lookup-safe variant handling.

Unicode IVD:
https://www.unicode.org/ivd/

Unicode licensing policy:
https://www.unicode.org/policies/licensing_policy.html

Unicode explains that its software and data files are generally released under **Unicode License v3 (SPDX: Unicode-3.0)**. The licence is permissive and expressly covers data/data files; the required copyright and permission notice must be retained where applicable.

Unicode License v3:
https://www.unicode.org/license.txt

Copyright © 1991-present Unicode, Inc. Unicode and the Unicode Logo are registered trademarks of Unicode, Inc. in the United States and other countries.

CJ2R does not redistribute Unicode code charts or fonts.

## Compatibility-source references

CJ2R also uses the Unicode compatibility-decomposition model to canonicalise narrowly scoped Japanese source-presentation characters before linguistic processing. The implementation is limited to compatibility symbols whose Unicode decomposition contains Japanese script; it is not a global NFKC rewrite.

Unicode Standard, Chapter 22 — Symbols:
https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-22/

Enclosed CJK Letters and Months (U+3200–U+32FF):
https://www.unicode.org/charts/PDF/U3200.pdf

CJK Compatibility (U+3300–U+33FF):
https://www.unicode.org/charts/PDF/U3300.pdf

Enclosed Ideographic Supplement (U+1F200–U+1F2FF):
https://www.unicode.org/charts/PDF/U1F200.pdf

## Japanese postal-mark compatibility

The Unicode Standard documents U+3020 `〠` POSTAL MARK FACE as a glyphic variant of U+3012 `〒` POSTAL MARK. CJ2R therefore canonicalises U+3020 to U+3012 before tokenisation so both source forms follow the same established postal-mark reading path. U+3036 `〶` is not included in this alias because the current Unicode code chart distinguishes it as a separate symbol rather than ordinary postal-mark text usage.

Source: Unicode Standard, CJK Symbols and Punctuation / CJK punctuation discussion and U+3000 code chart.

## Ideographic variation indicator

Unicode defines U+303E `〾` IDEOGRAPHIC VARIATION INDICATOR as a visible indicator that the following ideograph is similar to, but not equal to, the intended character. The two-character sequence provides only an approximation until the intended character can be identified or made available. CJ2R therefore treats the indicator itself as unresolved Japanese orthography and requires review; the following approximate ideograph may remain visible/transliterated as evidence, but it does not make the overall result authoritative.

U+303F `〿` IDEOGRAPHIC HALF FILL SPACE is separately defined as a visible display-cell filler retained for compatibility and is not folded into the U+303E unresolved-intended-character rule.

Unicode Standard, Version 17.0, §6.2.13 “Unknown or Unavailable Ideographs”:
https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-06/

CJK Symbols and Punctuation (U+3000–U+303F):
https://www.unicode.org/charts/PDF/U3000.pdf

## Historical Japanese kana block scope

Unicode defines Kana Supplement (U+1B000–U+1B0FF) and Kana Extended-A (U+1B100–U+1B12F) for historic and variant forms of Japanese kana, including hentaigana. CJ2R uses this block/script evidence only to classify assigned Hiragana/Katakana characters from those ranges as Japanese orthography for audit safety. It does not infer a reading from block membership alone.

Characters without maintained reading evidence therefore remain `[Unresolved]` and review-required, but are counted as unresolved Japanese readings rather than non-Japanese/out-of-scope script. Katakana Phonetic Extensions (U+31F0–U+31FF), which are materially associated with Ainu orthography, are not included by this rule.

Unicode Standard, Version 17.0, §18.4.5 “Kana Supplement” / “Kana Extended-A”:
https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-18/

Kana Supplement:
https://www.unicode.org/charts/PDF/U1B000.pdf

Kana Extended-A:
https://www.unicode.org/charts/PDF/U1B100.pdf



## Hentaigana phonetic correspondence

Unicode encodes the hentaigana repertoire in Kana Supplement and Kana Extended-A and documents that the encoded hentaigana generally correspond to single syllables. CJ2R combines that encoding identity with the CODH/NINJAL modern-hiragana correspondence table to normalise only single-valued hentaigana in explicit historical mode.

The automatic path contains 274 single-valued code points. Multi-valued characters remain unresolved/review-required rather than choosing one of their attested kana values. U+1B001 is also excluded from automatic conversion because Unicode preserves both the historic `HIRAGANA LETTER ARCHAIC YE` identity and the `HENTAIGANA LETTER E-1` alias.

Unicode Core Specification, Chapter 18:
https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-18/

CODH Unicode Hentaigana List (linked to NINJAL resources):
https://codh.rois.ac.jp/char-shape/hentaigana/
