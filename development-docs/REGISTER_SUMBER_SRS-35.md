# Register sumber dan pemulihan baseline — SRS-35

Status: **DRAFT — NEEDS REVIEW; SOURCE REQUIRED**

Tanggal pemeriksaan: 10 November 2026

Issue: [SRS-35](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-35)

Snapshot yang diperiksa: `develop` pada commit `ea6dd9cfa4943f1afd546bed2c9cdc965f09ccdd`.

Register ini mencatat apa yang tersedia pada snapshot tersebut. Keberadaan dokumen draft bukan bukti bahwa dokumen asli telah diterima, isi telah disetujui, atau kebutuhan telah terpenuhi. Hash adalah SHA-256 atas isi berkas pada snapshot, bukan tanda tangan atau bukti persetujuan.

## Sumber yang tersedia

| Sumber | Versi/status yang tercantum | Bagian yang digunakan | SHA-256 |
| --- | --- | --- | --- |
| `AGENTS.md` | Panduan repository; versi tidak dicantumkan | Baseline 16 UC, 29 FR, 14 NFR dan ketentuan dokumentasi | `b0f923128692d57a455223e2a4e129e4cb4862df15707e0c787b04c87816a353` |
| `design.md` (SRC-09) | 1.0.0; untuk ditinjau | Kontrak desain frontend; konflik tetap memerlukan keputusan | `d250dfd717c1a75bc8a15f3f04a3a44143a4eec8a90ec069521d2b2c9b08f2ec` |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | 0.2.0; NEEDS REVIEW | Register SRC-01–SRC-09, OD-01–OD-10 dan konflik | `358bca4bfe64fe3a8311f5d3e4149ffcda8fc323294291365f1297d62e06cbf6` |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | 0.2.0; NEEDS REVIEW | Inventaris dan uraian UC-01–UC-16 untuk dibandingkan dengan sumber final | `4de24c309ecb88bc747f7202ef0884152c8119c1f395a6f9a3ac03b41d6ecf22` |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | 0.2.0; NEEDS REVIEW | Slot kebutuhan dan batas ketersediaan FR | `9d8b7b35caaccf3aec5c3d3fedd89c77315ef48f444a47488939fa6b93c53e32` |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | 0.2.0; NEEDS REVIEW | 55 slot sumber dan skenario turunan yang terpisah | `b5607bc41e2322caf212a2a9cdb455d65eb9beed3cbd5911e13e10c2df315100` |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | 0.2.0; NEEDS REVIEW | Matriks keterlacakan dan pengendalian perubahan | `b82fceb3058e6843c18b024fe203633e7f8246f4ad28777074413eb08d54feda` |
| [DOC-16](16_SECURITY_RISK_NFR.md) | 0.2.0; NEEDS REVIEW | Slot NFR, risiko dan batas verifikasi | `56da5cd87aa6d9468dabbb2a509e6946c982f8d85f798ac2feca5df04f6291d2` |

SRC-01 tercatat pada DOC-00 sebagai prompt dalam percakapan penyusunan; naskah terpisah dan hash-nya tidak tersedia pada snapshot. Jangan menganggap DOC-03 atau DOC-04 sebagai pengganti dokumen final yang belum diterima.

## Sumber yang masih diperlukan

| ID sumber DOC-00 | Sumber yang dibutuhkan | Dampak dan tindak lanjut |
| --- | --- | --- |
| SRC-03 | SRS final dengan identitas dan pernyataan asli 29 FR dan 14 NFR | SOURCE REQUIRED; cocokkan ID, makna dan hubungan tanpa penomoran ulang pada DOC-04, DOC-15 dan DOC-16. |
| SRC-04 | PRD, business flow dan BPMN final | SOURCE REQUIRED; bandingkan aktor dan alur dengan DOC-03 dan desain terkait. |
| SRC-05 dan SRC-06 | DESAIN-42-1.1 dan REVISI-UML-42-1.2 | SOURCE REQUIRED; identifikasi bagian yang direvisi secara eksplisit sebelum membandingkan UML dan desain. |
| SRC-07 | 55 spesifikasi pengujian asli beserta identitas dan hasil yang diharapkan | SOURCE REQUIRED; petakan hanya berdasarkan sumber pada DOC-13 dan DOC-15. |
| SRC-08 | Sampel sumber operasional dan master yang diizinkan untuk analisis | SOURCE REQUIRED; simpan data ACTUAL secara terpisah dan gunakan fixture UJI berlabel untuk pengujian. |

Ketiadaan di atas berarti sumber tersebut tidak ditemukan dalam snapshot repository yang diperiksa; hal ini tidak membuktikan bahwa sumber tidak ada di luar repository. Versi, hash, bagian dan bukti persetujuan sumber final diisi setelah diterima dan diperiksa.

## Status pemetaan dan langkah review

- DOC-03 memuat UC-01–UC-16 sebagai inventaris draft. Identitas, makna, aktor dan keterkaitan dengan baseline final **belum dapat diverifikasi**.
- DOC-04 dan DOC-15 menyediakan tempat pencatatan FR; DOC-16 menyediakan tempat pencatatan NFR. ID, pernyataan dan mapping asli tetap **SOURCE REQUIRED**. Jumlah baseline tetap 29 FR dan 14 NFR.
- DOC-13 memisahkan 55 slot pengujian sumber dari skenario turunan PROPOSED. Slot bukan bukti bahwa spesifikasi asli telah dipulihkan, dan skenario turunan tidak menambah jumlah baseline.
- Setelah sumber tersedia, catat versi dan hash, bandingkan tiap identitas dan bagian sumber dengan dokumen terkait, catat konflik dan keputusan berwenang, lalu minta review independen. Jangan menutup gap melalui asumsi.

Pemeriksaan ini belum memverifikasi konsistensi semantik terhadap sumber final, belum menghasilkan keputusan stakeholder, dan belum memenuhi seluruh Definition of Done SRS-35. Tidak ada hasil pengujian atau penerimaan stakeholder yang diklaim.
