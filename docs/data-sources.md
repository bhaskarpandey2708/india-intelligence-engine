# India Intelligence Engine — Data Sources

All data is public, open-source, or government-released. Large files are stored on HuggingFace, not GitHub.

**HuggingFace Dataset:** `bhaskarpandey2708/india-intelligence-data`

---

## Census 2011

| Dataset | Rows | HF Path | Source |
|---|---|---|---|
| District Census 2011 | 640 | `data/census/census_district_2011.parquet` | Office of RGI, India |
| State Population 2011 | 36 | `data/census/census_state_2011.parquet` | Office of RGI, India |
| Habitation Info 2009 | 1,658,322 | `data/census/habitation_2009.parquet` | Census of India |
| Habitation Info 2010 | 1,661,057 | `data/census/habitation_2010.parquet` | Census of India |
| Habitation Info 2011 | 1,664,185 | `data/census/habitation_2011.parquet` | Census of India |
| Habitation Info 2012 | 1,666,074 | `data/census/habitation_2012.parquet` | Census of India |

**Key columns (District Census):** Population, Male, Female, Literate, SC, ST, Workers, Hindus, Muslims, Christians, Sikhs, Buddhists, Jains, Households, electricity, LPG, internet, education levels, age groups, sex ratio

---

## 6th Minor Irrigation Census (MI6)

Ground water and surface water irrigation schemes at village level.

**Naming convention:** `MI6_{GW/SW}_{scheme_type}_{state_code}.parquet`
- `GW` = Ground Water, `SW` = Surface Water
- `DTW` = Deep Tube Well, `MTW` = Medium Tube Well, `STW` = Shallow Tube Well, `DGW` = Dug Well
- `SF` = Surface Flow, `SL` = Surface Lift

**HF Path:** `data/minor_irrigation/`

| State | File | Rows |
|---|---|---|
| Andhra Pradesh | MI6_GW_DTW_AP.parquet | 525,593 |
| Uttar Pradesh | MI6_GW_MTW_UP.parquet | 418,316 |
| Karnataka | MI6_GW_DTW_KR.parquet | 330,824 |
| Rajasthan | MI6_GW_MTW_RJ.parquet | 140,380 |
| Chhattisgarh | MI6_GW_DTW_CG.parquet | 117,354 |
| Odisha | MI6_GW_DTW_OD.parquet | 61,434 |
| West Bengal | MI6_GW_MTW_WB.parquet | 82,266 |
| + 13 smaller states | ... | ... |

**Key columns:** state, district, block, village, scheme_type, owner, depth, cost, irrigation_potential_created, irrigation_potential_utilized, social_status, gender

**Source:** Ministry of Jal Shakti, data.gov.in (Public Domain)

---

## Geographic Boundaries (SHRUG v2.1)

| Layer | Features | HF Path | Size |
|---|---|---|---|
| States (simplified) | 35 | `geo/geo_states_simplified.geojson` | 0.8 MB |
| Districts (simplified) | 641 | `geo/geo_districts_simplified.geojson` | 4.3 MB |
| Sub-Districts (simplified) | 5,969 | `geo/geo_subdistricts_simplified.geojson` | 22.6 MB |
| Villages (raw shapefile) | 648,254 | Local only | 653 MB |

**Source:** SHRUG v2.1, Development Data Lab — License: CC BY-NC-SA 4.0
**Projection:** EPSG:4326 (WGS84)
**Join key:** PC11 codes (2-digit state, 3-digit district, 4-digit sub-district, 6-digit village)

---

## Roadmap — Datasets to Add

- [ ] Census 2021 (being released in phases)
- [ ] NFHS-5 (National Family Health Survey)
- [ ] NSSO/PLFS (Labour Force Survey)
- [ ] PM-KISAN beneficiary data
- [ ] MGNREGS work data
- [ ] School Education data (UDISE+)
- [ ] Health facility data (HMIS)
- [ ] Election Commission — booth-level results
- [ ] Air quality (CPCB)
- [ ] Rainfall (IMD)
