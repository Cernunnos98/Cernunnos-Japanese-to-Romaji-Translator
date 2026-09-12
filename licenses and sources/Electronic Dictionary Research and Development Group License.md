# Electronic Dictionary Research and Development Group attribution and licence conditions

Cernunnos' Japanese to Romaji Translator (CJ2R) uses selected data derived from **JMdict**, **JMnedict**, and **KANJIDIC2/KANJIDIC**, maintained by the Electronic Dictionary Research and Development Group (EDRDG).

Official EDRDG project and licence information:

- https://www.edrdg.org/
- https://www.edrdg.org/edrdg/licence.html

The EDRDG General Dictionary Licence Statement applies to the covered dictionary files, their associated documentation, and data files derived from them. The covered material is made available under **Creative Commons Attribution-ShareAlike 4.0**, together with the additional conditions stated by EDRDG.

CJ2R does not present its compact derived evidence banks or Kanji helper data as complete copies of the current upstream dictionaries. The source snapshots used by CJ2R are identified in the relevant attribution, provenance and metadata files.

## Attribution and redistribution

A software package, WWW server, smartphone app or similar deployment that uses or incorporates EDRDG-covered data must acknowledge the source and usage of the files in its documentation, publicity material, website or equivalent user-facing source information. Software packages must also provide the applicable documentation and licence files, or links to them where the packaging format does not permit their inclusion.

If a WWW server provides a dictionary function or displays words from the EDRDG files on screen, EDRDG requires acknowledgement on each screen display. Where the EDRDG material is mixed with information from other sources, a general source acknowledgement is sufficient under the EDRDG statement.

EDRDG-covered material must not be presented as though CJ2R owns it or relicenses it solely under the CJ2R project licence. Adding CJ2R material to EDRDG-derived material does not remove or diminish EDRDG's copyright in the covered source material.

## CJ2R update procedure

EDRDG requires software, WWW servers, apps and similar systems that use or incorporate the covered data to have a procedure for **regular updating from the most recent versions available**. EDRDG gives monthly updating as an example for WWW-based dictionary servers; it does not state one universal fixed interval for every type of software.

CJ2R provides the maintenance procedure in `tools/edrdg-update/`:

1. Run `node tools/edrdg-update/cj2r-edrdg-updater.js` from the CJ2R project root.
2. The updater obtains or accepts current Jitendex/JMdict, JMnedict and KANJIDIC snapshots, records their SHA-256 values, validates the archive and Yomitan structure, and compares the maintained CJ2R derivatives with those sources.
3. The updater creates an isolated candidate project, a review report and a SHA-256-pinned update manifest. It does not silently modify live runtime data during this preparation step.
4. Any upstream reading that no longer supports a maintained CJ2R entry becomes a review blocker. The update cannot be applied until the discrepancy is resolved and a new clean manifest is prepared.
5. After review, apply the exact pinned manifest with the command described in `tools/edrdg-update/cj2r-edrdg-updater-guide.md`. The updater runs the complete CJ2R release gate before promotion and again after promotion. A failed live gate restores the previous files.
6. A maintainer or downstream operator should run this procedure regularly enough to keep the EDRDG-derived material used by that maintained deployment up to date. CJ2R does not impose a fixed cadence beyond the requirements of the upstream EDRDG licence.

The updater deliberately does not import every new dictionary entry into CJ2R. CJ2R uses compact reviewed derivatives. The procedure keeps those selected derivatives tied to current source snapshots while preserving review and regression safeguards.

## Warranty, liability and copyright conditions

The EDRDG source files are supplied without warranty as to accuracy or suitability. The official EDRDG licence states that users of the files must assume liability for their use or misuse, must not hold the Group liable for consequences arising from use of the files, must refrain from claims against the Group based on use of the files, and must indemnify the Group or its members in the circumstances stated in the licence.

Anyone who becomes aware of a possible copyright infringement in the EDRDG files must follow the reporting obligation in the official EDRDG licence statement.

## KANJIDIC-specific conditions

EDRDG states additional conditions for KANJIDIC, KANJIDIC2 and related files because some included fields contain material whose copyright remains with named contributors. CJ2R records the KANJIDIC-specific source information in `KANJIDIC Attribution.md` and retains the official EDRDG licence link above.

This file is a project compliance notice and update procedure. The official EDRDG General Dictionary Licence Statement remains authoritative for the EDRDG-covered material.
