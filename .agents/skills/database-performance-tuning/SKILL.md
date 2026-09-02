---
name: database-performance-tuning
description: >-
  Procedures for PostgreSQL indexing, JPA query optimization (preventing N+1 queries),
  connection pool management (HikariCP), and Firebase Firestore indexing.
---

# Database Performance Tuning & Indexing Skill

Use this skill when optimizing slow queries, adding database indexes, configuring connection pooling, or tuning Firestore rules and composite indexes.

## 1. JPA / Hibernate Query Optimization
- **N+1 Problem Prevention**:
  - Use `JOIN FETCH` in JPQL queries for `@OneToMany` and `@ManyToOne` relationships (e.g. `Solicitud` with `Offers` or `User`).
  - Prefer `@EntityGraph` when loading entity graphs conditionally.
  - Avoid eager fetching (`FetchType.EAGER`) on collections.
- **Batch Processing**:
  - Configure `spring.jpa.properties.hibernate.jdbc.batch_size=30` for bulk inserts and updates.

## 2. PostgreSQL Indexing Strategy
- Add B-tree indexes on foreign keys and frequently filtered columns (`status`, `user_id`, `created_at`).
- For geospatial coordinates, utilize spatial indexing or bounding box filters before calculating exact Haversine distances.
- Check execution plans using `EXPLAIN ANALYZE` on heavy query paths.

## 3. Firebase / Firestore Indexes & Rules
- Ensure composite indexes are declared in `firestore.indexes.json` for queries combining `where()` and `orderBy()`.
- Validate that read queries limit returned documents (`limit(N)`) to minimize bandwidth and read costs.
