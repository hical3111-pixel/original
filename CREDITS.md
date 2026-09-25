# 효과음 출처

제작자는 아래 출처별로 기록합니다. 모든 효과음은 **Creative Commons Zero (CC0 1.0 / Public Domain)** 입니다. [CC0 원문](https://creativecommons.org/publicdomain/zero/1.0/). 공식 팩의 `License.txt`도 `sfx/licenses/`에 보관합니다. CC0 이외의 음원은 포함하지 않았습니다.

## 원본 팩

- [Impact Sounds](https://kenney.nl/assets/impact-sounds) — CC0; [동봉 라이선스](sfx/licenses/impact.txt)
- [RPG Audio](https://kenney.nl/assets/rpg-audio) — CC0; [동봉 라이선스](sfx/licenses/rpg.txt)
- [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) — CC0; [동봉 라이선스](sfx/licenses/scifi.txt)

## 사용 파일

기존 Kenney 후보는 공식 배포 ZIP의 `Audio/` 파일을 변환했습니다. mono MP3, 44.1 kHz, 128 kbps. 저역 35 Hz / 고역 6.5 kHz 필터와 -20 LUFS / -3 dBTP 정규화만 적용했습니다. 게임 실행에 변환 도구는 필요하지 않습니다.

| 저장 파일 | 팩 | 원본 파일 | 라이선스 | 크기 (bytes) |
|---|---|---|---|---:|
| `sfx/rumble.mp3` | Sci-fi Sounds | `Audio/lowFrequency_explosion_000.ogg` | CC0 1.0 | 33061 |
| `sfx/rumble2.mp3` | Sci-fi Sounds | `Audio/lowFrequency_explosion_001.ogg` | CC0 1.0 | 17179 |
| `sfx/crunch.mp3` | Sci-fi Sounds | `Audio/explosionCrunch_000.ogg` | CC0 1.0 | 13417 |
| `sfx/crunch2.mp3` | Sci-fi Sounds | `Audio/explosionCrunch_003.ogg` | CC0 1.0 | 25956 |
| `sfx/fire.mp3` | Sci-fi Sounds | `Audio/thrusterFire_000.ogg` | CC0 1.0 | 81127 |
| `sfx/fire2.mp3` | Sci-fi Sounds | `Audio/thrusterFire_002.ogg` | CC0 1.0 | 81127 |
| `sfx/glass.mp3` | Impact Sounds | `Audio/impactGlass_heavy_000.ogg` | CC0 1.0 | 5058 |
| `sfx/glass2.mp3` | Impact Sounds | `Audio/impactGlass_heavy_003.ogg` | CC0 1.0 | 3804 |
| `sfx/glasslight.mp3` | Impact Sounds | `Audio/impactGlass_light_002.ogg` | CC0 1.0 | 4222 |
| `sfx/glassmid.mp3` | Impact Sounds | `Audio/impactGlass_medium_001.ogg` | CC0 1.0 | 9656 |
| `sfx/bell.mp3` | Impact Sounds | `Audio/impactBell_heavy_000.ogg` | CC0 1.0 | 24702 |
| `sfx/bell2.mp3` | Impact Sounds | `Audio/impactBell_heavy_003.ogg` | CC0 1.0 | 11745 |
| `sfx/punch.mp3` | Impact Sounds | `Audio/impactPunch_heavy_000.ogg` | CC0 1.0 | 11327 |
| `sfx/punch2.mp3` | Impact Sounds | `Audio/impactPunch_heavy_003.ogg` | CC0 1.0 | 8820 |
| `sfx/metal.mp3` | Impact Sounds | `Audio/impactMetal_heavy_002.ogg` | CC0 1.0 | 2968 |
| `sfx/slice.mp3` | RPG Audio | `Audio/knifeSlice.ogg` | CC0 1.0 | 10492 |
| `sfx/slice2.mp3` | RPG Audio | `Audio/knifeSlice2.ogg` | CC0 1.0 | 10074 |
| `sfx/chop.mp3` | RPG Audio | `Audio/chop.ogg` | CC0 1.0 | 5058 |

기존 Kenney 후보: **359,793 bytes / 18개**. 비교를 위해 모두 유지합니다.

파일 이름에서 성격을 추정해 임시 배정했습니다. ‘얼음’, ‘불꽃’ 등은 게임 속 용도이며 원본 녹음 대상에 대한 주장이 아닙니다. 수련장의 소리 고르기로 실제 소리를 비교할 수 있습니다.

## 2차 후보 — 불꽃·얼음·포효·타격

2026-09-25 각 공식 배포 페이지의 CC0 표시를 확인했습니다. Freesound 4종은 로그인 없는 **공식 HQ MP3 미리듣기**를 사용했습니다. 아래 원본 파일명은 원본 다운로드 링크에 표시된 이름이며 WAV/FLAC 원본을 받은 것으로 표기하지 않습니다. 나머지는 공식 무료 팩에서 추출했습니다. 출처 확인 기록은 [recordings.txt](sfx/licenses/recordings.txt)에 있습니다.

- [Fire Whoosh](https://freesound.org/people/hnhnh/sounds/244926/) — hnhnh, **CC0 1.0**
- [Ice Cracking](https://freesound.org/people/timbreknight/sounds/342546/) — timbreknight, **CC0 1.0**
- [Deep Monster Growl](https://freesound.org/people/uagadugu/sounds/222523/) — uagadugu, **CC0 1.0**
- [Basic Spell Impacts](https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx) — lentikula, **CC0 1.0**
- [Ice breaking/shattering](https://opengameart.org/content/ice-breakingshattering) — IgnasD, **CC0 1.0**
- [37 hits/punches](https://opengameart.org/content/37-hitspunches) — Independent.nu (submitted by qubodup), **CC0 1.0**
- [Firecracker Explosion](https://freesound.org/people/unfa/sounds/609588/) — unfa, **CC0 1.0**

mono MP3 / 44.1 kHz / 128 kbps. 먼저 mono로 합친 뒤 35 Hz~6.5 kHz 필터, -20 LUFS / -3 dBTP 정규화, 시작 3ms·끝 80ms 페이드를 적용했습니다. 아래 시간은 입력 파일에서 자른 시작/길이(초)입니다. 마법 팩은 제작자가 녹음과 CC0 소리를 섞어 만든 효과음이며, 모든 후보를 생녹음이라고 주장하지 않습니다.

| 저장 파일 | 팩 | 원본 파일 | 구간 시작 / 길이 | 라이선스 | 크기 (bytes) |
|---|---|---|---|---|---:|
| `sfx/field_fire.mp3` | Fire Whoosh | `244926__hnhnh__fire-whoosh.wav` | 1.65 / 1.9 | CC0 1.0 | 31390 |
| `sfx/field_ice.mp3` | Ice Cracking | `342546__timbreknight__ice-cracking.wav` | 0.44 / 1.0 | CC0 1.0 | 17179 |
| `sfx/field_ice_heavy.mp3` | Ice Cracking | `342546__timbreknight__ice-cracking.wav` | 4.02 / 1.1 | CC0 1.0 | 17179 |
| `sfx/field_growl.mp3` | Deep Monster Growl | `222523__uagadugu__deep-monster-growl.wav` | 0.26 / 2.4 | CC0 1.0 | 39331 |
| `sfx/spell_fire.mp3` | Basic Spell Impacts | `Fire Spell Impacts/Fire Spell Impact 4.wav` | 0.03 / 1.8 | CC0 1.0 | 29718 |
| `sfx/spell_fire_heavy.mp3` | Basic Spell Impacts | `Fire Spell Impacts/Fire Spell Impact 2.wav` | 0 / 2.9 | CC0 1.0 | 46018 |
| `sfx/spell_ice.mp3` | Basic Spell Impacts | `Ice Spell Impacts/Ice Spell Impact 5.wav` | 0.015 / 1.75 | CC0 1.0 | 28882 |
| `sfx/spell_ice_heavy.mp3` | Basic Spell Impacts | `Ice Spell Impacts/Ice Spell Impact 2.wav` | 0 / 2.5 | CC0 1.0 | 41003 |
| `sfx/shatter.mp3` | Ice breaking/shattering | `IceShatters/LedasLuzta.ogg` | 0 / 0.58 | CC0 1.0 | 10492 |
| `sfx/shatter_heavy.mp3` | Ice breaking/shattering | `IceShatters/LedasLuzta33.ogg` | 0.03 / 1.27 | CC0 1.0 | 21358 |
| `sfx/body_hit.mp3` | 37 hits/punches | `hits/hit09.mp3.flac` | 0.125 / 0.47 | CC0 1.0 | 8402 |
| `sfx/body_hit_heavy.mp3` | 37 hits/punches | `hits/hit10.mp3.flac` | 0.04 / 1.0 | CC0 1.0 | 17179 |
| `sfx/field_blast.mp3` | Firecracker Explosion | `609588__unfa__firecracker-explosion.flac` | 0 / 2.2 | CC0 1.0 | 36405 |

추가 **344,536 bytes / 13개**, 전체 **704,329 bytes / 31개** (5 MB 이하). Sonniss 음원은 포함하지 않았습니다.

## 3차 기본값 — itch.io 마법 팩

진홍·빙정의 일반기/연계기/각성기 시작·적중·강타 기본값을 아래 itch.io 팩으로 통일했습니다. 기존 후보 31개는 비교용으로 유지하며, 그중 Basic Spell Impacts의 기존 4개도 계속 사용합니다. 추가 팩은 2026-09-26 공식 페이지에서 CC0를 확인하고 무료 다운로드로 받았습니다. 팩에 별도 라이선스 파일은 없으므로 [공식 페이지의 선언 기록](sfx/licenses/itch-packs.txt)을 보관합니다.

- [Basic Spell Impacts](https://lentikula.itch.io/freecc0-basic-spell-impacts-sfx) — lentikula, CC0 1.0. 불·얼음 각 5종에서 선택.
- [Druid Spell Impacts](https://lentikula.itch.io/druid-spell-impacts) — lentikula, CC0 1.0. 바람 2종을 준비음에 사용.
- [Healing Spell Impacts](https://lentikula.itch.io/healing-spell-impacts) — lentikula, CC0 1.0. 회복 마법 2종을 빙정 준비음에 사용(게임의 회복 효과 추가 아님).

형식·필터·정규화·페이드는 2차와 같습니다. 적중용은 강한 파형 직전부터 짧게, 준비·강타용은 더 길게 잘랐습니다. 모든 변경은 효과음에만 적용됩니다.

| 저장 파일 | 팩 | 원본 파일 | 구간 시작 / 길이(초) | 라이선스 | 크기 (bytes) |
|---|---|---|---|---|---:|
| `sfx/itch_fire1.mp3` | Basic Spell Impacts | `Fire Spell Impacts/Fire Spell Impact 1.wav` | 0.5 / 2.4 | CC0 1.0 | 39331 |
| `sfx/itch_fire3.mp3` | Basic Spell Impacts | `Fire Spell Impacts/Fire Spell Impact 3.wav` | 0.45 / 0.65 | CC0 1.0 | 11327 |
| `sfx/itch_fire5.mp3` | Basic Spell Impacts | `Fire Spell Impacts/Fire Spell Impact 5.wav` | 0.055 / 1.8 | CC0 1.0 | 29718 |
| `sfx/itch_ice1.mp3` | Basic Spell Impacts | `Ice Spell Impacts/Ice Spell Impact 1.wav` | 0.6 / 1.8 | CC0 1.0 | 29718 |
| `sfx/itch_ice3.mp3` | Basic Spell Impacts | `Ice Spell Impacts/Ice Spell Impact 3.wav` | 0.61 / 0.65 | CC0 1.0 | 11327 |
| `sfx/itch_ice4.mp3` | Basic Spell Impacts | `Ice Spell Impacts/Ice Spell Impact 4.wav` | 0.45 / 1.4 | CC0 1.0 | 23448 |
| `sfx/itch_wind2.mp3` | Druid Spell Impacts | `Wind Spell Impacts/Wind Spell Impact 2.wav` | 0.175 / 1.5 | CC0 1.0 | 24284 |
| `sfx/itch_wind5.mp3` | Druid Spell Impacts | `Wind Spell Impacts/Wind Spell Impact 5.wav` | 0.05 / 0.8 | CC0 1.0 | 12999 |
| `sfx/itch_heal10.mp3` | Healing Spell Impacts | `Impacts/Healing Spell Impact 10.wav` | 0.13 / 0.8 | CC0 1.0 | 13835 |
| `sfx/itch_heal11.mp3` | Healing Spell Impacts | `Impacts/Healing Spell Impact 11.wav` | 0 / 1.5 | CC0 1.0 | 24284 |

이번 추가 **220,271 bytes / 10개**, 현재 전체 **924,600 bytes / 41개** (5 MB 이하). 기본값은 itch.io 팩만 사용하며 다른 계열의 소리는 변경하지 않았습니다.
