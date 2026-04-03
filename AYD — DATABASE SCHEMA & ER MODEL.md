**AFRICAN** **YOUTH** **DATABASE** **—** **DATABASE** **SCHEMA** **&**
**ER** **MODEL**

**1.** **Database** **Design** **Philosophy**

The database is designed to be:

> ● **Relational-first** (PostgreSQL on AWS RDS)
>
> ● **Analytics-friendly**
>
> ● **Highly** **normalized** for trust, provenance, and versioning
>
> ● **Extensible** for future ML, APIs, and policy simulations

**2.** **Core** **Entities** **Overview**

High-level entity groups:

> 1\. **Geography** **&** **Classification**
>
> 2\. **Users** **&** **Access** **Control**
>
> 3\. **Datasets** **&** **Indicators**
>
> 4\. **Data** **Values** **(Facts)**
>
> 5\. **Visualization** **&** **Dashboards**
>
> 6\. **African** **Youth** **Index**
>
> 7\. **Trust,** **Provenance** **&** **Versioning**
>
> 8\. **AI** **Insights** **&** **Reports**
>
> 9\. **API** **&** **Usage** **Tracking**

**3.** **CORE** **TABLES** **(FOUNDATION)**

**3.1** **countries**

Stores all African countries.

> **Field**
>
> id
>
> name
>
> iso_code
>
> region
>
> population
>
> geometry
>
> created_a
>
> t
>
> **Type**

UUID (PK)

VARCHAR

VARCHAR(3)

VARCHAR

BIGINT

GEOMETRY

TIMESTAMP

> **Description**

Unique country ID

Country name

ISO 3166-1 code

Region (West, East, etc.)

Total population

GeoJSON for maps

Record creation

**3.2** **regions**

Optional grouping (ECOWAS, SADC, AU regions).

> **Field** **Type**
>
> id UUID (PK)
>
> nam VARCHAR e
>
> type VARCHAR (economic / geographic)

**4.** **USERS** **&** **ACCESS** **CONTROL**

**4.1** **users**

All platform users.

> **Field**
>
> id
>
> full_name
>
> email
>
> password_has h
>
> role
>
> organization
>
> is_verified
>
> created_at
>
> **Type**

UUID (PK)

VARCHAR

VARCHAR (unique)

TEXT

ENUM (public, researcher, contributor, admin)

VARCHAR

BOOLEAN

TIMESTAMP

**4.2** **organizations**

Institutions contributing or consuming data.

> **Field**
>
> id
>
> name
>
> type
>
> country_id
>
> verified
>
> **Type**

UUID (PK)

VARCHAR

ENUM (government, NGO, university, private)

UUID (FK → countries)

BOOLEAN

**5.** **DATASET** **&** **INDICATOR** **LAYER**

This is the **heart** **of** **AYD**.

**5.1** **themes**

High-level categories.

> **Field** **Type**
>
> id
>
> name
>
> description

UUID (PK)

VARCHAR

TEXT

**Examples:** Employment, Education, Health, Agriculture, Gender,
Innovation

**5.2** **indicators**

Defines *what* *is* *being* *measured*.

> **Field**
>
> id
>
> name
>
> unit
>
> description
>
> theme_id
>
> methodology
>
> created_at
>
> **Type**

UUID (PK)

VARCHAR

VARCHAR (%, number, index)

TEXT

UUID (FK → themes)

TEXT

TIMESTAMP

**5.3** **datasets**

Groups indicator data.

> **Field**
>
> id
>
> title
>
> description
>
> source_org_i d
>
> year_start
>
> year_end
>
> **Type**

UUID (PK)

VARCHAR

TEXT

UUID (FK → organizations)

INT

INT

> status
>
> created_by
>
> created_at

ENUM (draft, pending, approved, archived)

UUID (FK → users)

TIMESTAMP

**6.** **DATA** **VALUES** **(FACT** **TABLE)**

This table enables **charts,** **comparisons,** **maps,** **and** **AI**
**insights**.

**6.1** **indicator_values**

Stores the actual numbers.

> **Field**
>
> id
>
> indicator_id
>
> country_id
>
> year
>
> value
>
> gender
>
> age_group
>
> dataset_id
>
> confidence_scor e
>
> created_at
>
> **Type**

UUID (PK)

UUID (FK → indicators)

UUID (FK → countries)

INT

NUMERIC

ENUM (male, female, total)

VARCHAR

UUID (FK → datasets)

DECIMAL(3,2)

TIMESTAMP

📌 This table powers:

> ● Charts
>
> ● Maps
>
> ● Comparisons
>
> ● Index calculations

**7.** **AFRICAN** **YOUTH** **INDEX** **MODULE**

**7.1** **youth_index**

Annual country rankings.

> **Field**
>
> id
>
> country_id
>
> year
>
> index_scor e
>
> rank
>
> created_at
>
> **Type**

UUID (PK)

UUID (FK → countries)

INT

DECIMAL(5,2)

INT

TIMESTAMP

**7.2** **youth_index_components**

Breakdown by indicator.

> **Field**
>
> id
>
> youth_index_id
>
> indicator_id
>
> weight
>
> normalized_scor
>
> e
>
> **Type**

UUID (PK)

UUID (FK → youth_index)

UUID (FK → indicators)

DECIMAL(3,2)

DECIMAL(5,2)

**8.** **VISUALIZATION** **&** **DASHBOARDS**

**8.1** **dashboards**

User-created dashboards.

> **Field**
>
> id
>
> user_id
>
> title
>
> is_public
>
> created_a
>
> t
>
> **Type**

UUID (PK)

UUID (FK → users)

VARCHAR

BOOLEAN

TIMESTAMP

**8.2** **dashboard_widgets**

Charts inside dashboards.

> **Field**
>
> id
>
> dashboard_i d
>
> chart_type
>
> indicator_id
>
> config
>
> position
>
> **Type**

UUID (PK)

UUID (FK → dashboards)

ENUM (bar, line, map, pie)

UUID

JSONB

INT

**9.** **AI** **INSIGHTS** **&** **REPORTS**

**9.1** **ai_insights**

AI-generated summaries.

> **Field** **Type**
>
> id
>
> entity_type
>
> entity_id
>
> summary
>
> approved
>
> generated_a
>
> t

UUID (PK)

ENUM (country, indicator, dataset)

UUID

TEXT

BOOLEAN

TIMESTAMP

**9.2** **reports**

Published data stories.

> **Field**
>
> id
>
> title
>
> content
>
> year
>
> published
>
> created_a
>
> t
>
> **Type**

UUID (PK)

VARCHAR

TEXT

INT

BOOLEAN

TIMESTAMP

**10.** **TRUST,** **PROVENANCE** **&** **VERSIONING**

**10.1** **dataset_versions**

Tracks changes over time.

> **Field**
>
> id
>
> dataset_id
>
> version
>
> **Type**

UUID (PK)

UUID

VARCHAR

> change_lo g
>
> created_at

TEXT

TIMESTAMP

**10.2** **audit_logs**

Full system accountability.

> **Field**
>
> id
>
> user_id
>
> action
>
> entity
>
> entity_id
>
> timestamp
>
> **Type**

UUID (PK)

UUID

VARCHAR

VARCHAR

UUID

TIMESTAMP

**11.** **API** **&** **USAGE** **TRACKING**

**11.1** **api_keys**

For developers & institutions.

> **Field**
>
> id
>
> user_id
>
> key
>
> tier
>
> created_a
>
> t
>
> **Type**

UUID (PK)

UUID

TEXT

ENUM (public, premium)

TIMESTAMP

**11.2** **api_usage**

Monitoring consumption.

> **Field**
>
> id
>
> api_key_id
>
> endpoint
>
> request_coun t
>
> timestamp
>
> **Type**

UUID (PK)

UUID

VARCHAR

INT

TIMESTAMP

**12.** **ENTITY** **RELATIONSHIP** **(ER)** **SUMMARY** COUNTRY ──\<
INDICATOR_VALUES \>── INDICATORS ──\< THEMES

> │ │
>
> │ └── DATASETS ──\< DATASET_VERSIONS │
>
> └── YOUTH_INDEX ──\< YOUTH_INDEX_COMPONENTS

USERS ──\< DASHBOARDS ──\< DASHBOARD_WIDGETS USERS ──\< DATASETS

ORGANIZATIONS ──\< DATASETS

INDICATORS ──\< AI_INSIGHTS COUNTRIES ──\< AI_INSIGHTS
