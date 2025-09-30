--
-- PostgreSQL database dump
--

\restrict lHIJdjwMKRJzVGRdd8RZrAtTj4VN13acJTzdhdQdiLQGXPhiGLlpEoGscwPLgst

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.version_journal DROP CONSTRAINT IF EXISTS version_journal_dataset_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.rule_columns DROP CONSTRAINT IF EXISTS rule_columns_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rule_columns DROP CONSTRAINT IF EXISTS rule_columns_column_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_execution_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fixes DROP CONSTRAINT IF EXISTS fixes_issue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.fixes DROP CONSTRAINT IF EXISTS fixes_fixed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.exports DROP CONSTRAINT IF EXISTS exports_execution_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exports DROP CONSTRAINT IF EXISTS exports_dataset_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exports DROP CONSTRAINT IF EXISTS exports_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.executions DROP CONSTRAINT IF EXISTS executions_started_by_fkey;
ALTER TABLE IF EXISTS ONLY public.executions DROP CONSTRAINT IF EXISTS executions_dataset_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.execution_rules DROP CONSTRAINT IF EXISTS execution_rules_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.execution_rules DROP CONSTRAINT IF EXISTS execution_rules_execution_id_fkey;
ALTER TABLE IF EXISTS ONLY public.datasets DROP CONSTRAINT IF EXISTS datasets_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.dataset_versions DROP CONSTRAINT IF EXISTS dataset_versions_dataset_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dataset_versions DROP CONSTRAINT IF EXISTS dataset_versions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.dataset_columns DROP CONSTRAINT IF EXISTS dataset_columns_dataset_id_fkey;
DROP INDEX IF EXISTS public.ix_version_journal_id;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_rules_id;
DROP INDEX IF EXISTS public.ix_rule_columns_id;
DROP INDEX IF EXISTS public.ix_issues_id;
DROP INDEX IF EXISTS public.ix_fixes_id;
DROP INDEX IF EXISTS public.ix_exports_id;
DROP INDEX IF EXISTS public.ix_executions_id;
DROP INDEX IF EXISTS public.ix_execution_rules_id;
DROP INDEX IF EXISTS public.ix_datasets_id;
DROP INDEX IF EXISTS public.ix_dataset_versions_id;
DROP INDEX IF EXISTS public.ix_dataset_columns_id;
ALTER TABLE IF EXISTS ONLY public.version_journal DROP CONSTRAINT IF EXISTS version_journal_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_pkey;
ALTER TABLE IF EXISTS ONLY public.rules DROP CONSTRAINT IF EXISTS rules_name_key;
ALTER TABLE IF EXISTS ONLY public.rule_columns DROP CONSTRAINT IF EXISTS rule_columns_pkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_pkey;
ALTER TABLE IF EXISTS ONLY public.fixes DROP CONSTRAINT IF EXISTS fixes_pkey;
ALTER TABLE IF EXISTS ONLY public.exports DROP CONSTRAINT IF EXISTS exports_pkey;
ALTER TABLE IF EXISTS ONLY public.executions DROP CONSTRAINT IF EXISTS executions_pkey;
ALTER TABLE IF EXISTS ONLY public.execution_rules DROP CONSTRAINT IF EXISTS execution_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.datasets DROP CONSTRAINT IF EXISTS datasets_pkey;
ALTER TABLE IF EXISTS ONLY public.dataset_versions DROP CONSTRAINT IF EXISTS dataset_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.dataset_columns DROP CONSTRAINT IF EXISTS dataset_columns_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
DROP TABLE IF EXISTS public.version_journal;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.rules;
DROP TABLE IF EXISTS public.rule_columns;
DROP TABLE IF EXISTS public.issues;
DROP TABLE IF EXISTS public.fixes;
DROP TABLE IF EXISTS public.exports;
DROP TABLE IF EXISTS public.executions;
DROP TABLE IF EXISTS public.execution_rules;
DROP TABLE IF EXISTS public.datasets;
DROP TABLE IF EXISTS public.dataset_versions;
DROP TABLE IF EXISTS public.dataset_columns;
DROP TABLE IF EXISTS public.alembic_version;
DROP TYPE IF EXISTS public.userrole;
DROP TYPE IF EXISTS public.sourcetype;
DROP TYPE IF EXISTS public.rulekind;
DROP TYPE IF EXISTS public.exportformat;
DROP TYPE IF EXISTS public.executionstatus;
DROP TYPE IF EXISTS public.datasetstatus;
DROP TYPE IF EXISTS public.criticality;
--
-- Name: criticality; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.criticality AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.criticality OWNER TO dh_user;

--
-- Name: datasetstatus; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.datasetstatus AS ENUM (
    'uploaded',
    'profiled',
    'validated',
    'cleaned',
    'exported'
);


ALTER TYPE public.datasetstatus OWNER TO dh_user;

--
-- Name: executionstatus; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.executionstatus AS ENUM (
    'queued',
    'running',
    'succeeded',
    'failed',
    'partially_succeeded'
);


ALTER TYPE public.executionstatus OWNER TO dh_user;

--
-- Name: exportformat; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.exportformat AS ENUM (
    'csv',
    'excel',
    'json',
    'api',
    'datalake'
);


ALTER TYPE public.exportformat OWNER TO dh_user;

--
-- Name: rulekind; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.rulekind AS ENUM (
    'missing_data',
    'standardization',
    'value_list',
    'length_range',
    'cross_field',
    'char_restriction',
    'regex',
    'custom'
);


ALTER TYPE public.rulekind OWNER TO dh_user;

--
-- Name: sourcetype; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.sourcetype AS ENUM (
    'csv',
    'excel',
    'sap',
    'ms_dynamics',
    'other'
);


ALTER TYPE public.sourcetype OWNER TO dh_user;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: dh_user
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'analyst',
    'viewer'
);


ALTER TYPE public.userrole OWNER TO dh_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO dh_user;

--
-- Name: dataset_columns; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.dataset_columns (
    id character varying NOT NULL,
    dataset_id character varying NOT NULL,
    name character varying NOT NULL,
    ordinal_position integer NOT NULL,
    inferred_type character varying,
    is_nullable boolean
);


ALTER TABLE public.dataset_columns OWNER TO dh_user;

--
-- Name: dataset_versions; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.dataset_versions (
    id character varying NOT NULL,
    dataset_id character varying NOT NULL,
    version_no integer NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    rows integer,
    columns integer,
    change_note text
);


ALTER TABLE public.dataset_versions OWNER TO dh_user;

--
-- Name: datasets; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.datasets (
    id character varying NOT NULL,
    name character varying NOT NULL,
    source_type public.sourcetype NOT NULL,
    original_filename character varying,
    checksum character varying,
    uploaded_by character varying NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    status public.datasetstatus,
    row_count integer,
    column_count integer,
    notes text
);


ALTER TABLE public.datasets OWNER TO dh_user;

--
-- Name: execution_rules; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.execution_rules (
    id character varying NOT NULL,
    execution_id character varying NOT NULL,
    rule_id character varying NOT NULL,
    error_count integer,
    rows_flagged integer,
    cols_flagged integer,
    note text
);


ALTER TABLE public.execution_rules OWNER TO dh_user;

--
-- Name: executions; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.executions (
    id character varying NOT NULL,
    dataset_version_id character varying NOT NULL,
    started_by character varying NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    finished_at timestamp without time zone,
    status public.executionstatus,
    total_rows integer,
    total_rules integer,
    rows_affected integer,
    columns_affected integer,
    summary text
);


ALTER TABLE public.executions OWNER TO dh_user;

--
-- Name: exports; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.exports (
    id character varying NOT NULL,
    dataset_version_id character varying NOT NULL,
    execution_id character varying,
    format public.exportformat NOT NULL,
    location character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exports OWNER TO dh_user;

--
-- Name: fixes; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.fixes (
    id character varying NOT NULL,
    issue_id character varying NOT NULL,
    fixed_by character varying NOT NULL,
    fixed_at timestamp without time zone DEFAULT now(),
    new_value text,
    comment text
);


ALTER TABLE public.fixes OWNER TO dh_user;

--
-- Name: issues; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.issues (
    id character varying NOT NULL,
    execution_id character varying NOT NULL,
    rule_id character varying NOT NULL,
    row_index integer NOT NULL,
    column_name character varying NOT NULL,
    current_value text,
    suggested_value text,
    message text,
    category character varying,
    severity public.criticality NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    resolved boolean
);


ALTER TABLE public.issues OWNER TO dh_user;

--
-- Name: rule_columns; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.rule_columns (
    id character varying NOT NULL,
    rule_id character varying NOT NULL,
    column_id character varying NOT NULL
);


ALTER TABLE public.rule_columns OWNER TO dh_user;

--
-- Name: rules; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.rules (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    kind public.rulekind NOT NULL,
    criticality public.criticality NOT NULL,
    is_active boolean,
    target_table character varying,
    target_columns text,
    params text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rules OWNER TO dh_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    role public.userrole NOT NULL,
    auth_provider character varying,
    auth_subject character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO dh_user;

--
-- Name: version_journal; Type: TABLE; Schema: public; Owner: dh_user
--

CREATE TABLE public.version_journal (
    id character varying NOT NULL,
    dataset_version_id character varying NOT NULL,
    event character varying NOT NULL,
    rows_affected integer,
    columns_affected integer,
    details text,
    occurred_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.version_journal OWNER TO dh_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.alembic_version (version_num) FROM stdin;
f3f72ff529c3
\.


--
-- Data for Name: dataset_columns; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.dataset_columns (id, dataset_id, name, ordinal_position, inferred_type, is_nullable) FROM stdin;
01825570-41be-4242-a1ad-647894dc8342	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	id	1	integer	f
db324185-e0a8-4e19-9cae-c53596c59fb1	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	name	2	text	t
9a63f1ee-ffbb-4745-82fb-737648a9edb1	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	age	3	decimal	t
d1e39bd8-9287-4c9f-bfbc-76081b174b42	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	city	4	text	t
4756d9b9-d1e6-4eb4-865c-c3af30a6ae60	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	email	5	text	t
\.


--
-- Data for Name: dataset_versions; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.dataset_versions (id, dataset_id, version_no, created_by, created_at, rows, columns, change_note) FROM stdin;
f24eb3ef-7659-4ef9-8ae0-ba18f5953c20	4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	1	aec2fdf0-70e4-48c7-867a-ed5ade70df11	2025-09-30 18:02:00.117445	9	5	Initial dataset upload
\.


--
-- Data for Name: datasets; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.datasets (id, name, source_type, original_filename, checksum, uploaded_by, uploaded_at, status, row_count, column_count, notes) FROM stdin;
4ba8f842-f90d-45f8-b7f5-13493dd7d3b1	test-1	csv	test.csv	057dd63742544e5ecda9257926b883a9	aec2fdf0-70e4-48c7-867a-ed5ade70df11	2025-09-30 18:02:00.088713	profiled	9	5	\N
\.


--
-- Data for Name: execution_rules; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.execution_rules (id, execution_id, rule_id, error_count, rows_flagged, cols_flagged, note) FROM stdin;
e63e3904-8b5f-4e25-b174-0d2983fdf8d4	190c9ae6-a60e-47e5-85a7-0877af6481ad	ceb9c0a0-fe58-42de-962c-95f619176d3c	0	0	0	Rule has no target columns configured
\.


--
-- Data for Name: executions; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.executions (id, dataset_version_id, started_by, started_at, finished_at, status, total_rows, total_rules, rows_affected, columns_affected, summary) FROM stdin;
190c9ae6-a60e-47e5-85a7-0877af6481ad	f24eb3ef-7659-4ef9-8ae0-ba18f5953c20	aec2fdf0-70e4-48c7-867a-ed5ade70df11	2025-09-30 18:02:07.503777	2025-09-30 18:02:07.542291	failed	9	1	0	0	{"total_issues": 0, "successful_rules": 0, "failed_rules": 1, "issues_by_severity": {}, "issues_by_category": {}}
\.


--
-- Data for Name: exports; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.exports (id, dataset_version_id, execution_id, format, location, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: fixes; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.fixes (id, issue_id, fixed_by, fixed_at, new_value, comment) FROM stdin;
\.


--
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.issues (id, execution_id, rule_id, row_index, column_name, current_value, suggested_value, message, category, severity, created_at, resolved) FROM stdin;
\.


--
-- Data for Name: rule_columns; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.rule_columns (id, rule_id, column_id) FROM stdin;
\.


--
-- Data for Name: rules; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.rules (id, name, description, kind, criticality, is_active, target_table, target_columns, params, created_by, created_at, updated_at) FROM stdin;
ceb9c0a0-fe58-42de-962c-95f619176d3c	Missing Email Address Detection	\N	missing_data	medium	t	\N	["email"]	{}	aec2fdf0-70e4-48c7-867a-ed5ade70df11	2025-09-30 03:46:44.189042	2025-09-30 03:46:44.189042
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.users (id, name, email, role, auth_provider, auth_subject, created_at, updated_at) FROM stdin;
aec2fdf0-70e4-48c7-867a-ed5ade70df11	Admin User	admin@datahygiene.com	admin	local	$2b$12$Z7YoBtRsbN/VY9LT2Aw46ONdh.9xF5XuQI0.AZZkdTkWzilZjcU1e	2025-09-30 02:57:33.470471	2025-09-30 02:57:33.470471
9ddbce69-587f-4d8d-84a3-caa9dfe7d012	Viewer	viewer@exampledemo.com	viewer	local	$2b$12$Yd7nePtf9ZpXL6DW3sDG/ecFbdR9wC2AsvlLhOBDZGnVHYsE0jYf.	2025-09-30 03:23:12.737177	2025-09-30 03:23:12.737177
3fbaa720-8599-4bca-94b4-ad86ee522119	Demo Analyst	demo@datahygiene.com	analyst	local	$2b$12$Z7YoBtRsbN/VY9LT2Aw46ONdh.9xF5XuQI0.AZZkdTkWzilZjcU1e	2025-09-30 02:57:33.470471	2025-09-30 03:25:46.26172
\.


--
-- Data for Name: version_journal; Type: TABLE DATA; Schema: public; Owner: dh_user
--

COPY public.version_journal (id, dataset_version_id, event, rows_affected, columns_affected, details, occurred_at) FROM stdin;
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: dataset_columns dataset_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.dataset_columns
    ADD CONSTRAINT dataset_columns_pkey PRIMARY KEY (id);


--
-- Name: dataset_versions dataset_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.dataset_versions
    ADD CONSTRAINT dataset_versions_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: execution_rules execution_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.execution_rules
    ADD CONSTRAINT execution_rules_pkey PRIMARY KEY (id);


--
-- Name: executions executions_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_pkey PRIMARY KEY (id);


--
-- Name: exports exports_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.exports
    ADD CONSTRAINT exports_pkey PRIMARY KEY (id);


--
-- Name: fixes fixes_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.fixes
    ADD CONSTRAINT fixes_pkey PRIMARY KEY (id);


--
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- Name: rule_columns rule_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rule_columns
    ADD CONSTRAINT rule_columns_pkey PRIMARY KEY (id);


--
-- Name: rules rules_name_key; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_name_key UNIQUE (name);


--
-- Name: rules rules_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: version_journal version_journal_pkey; Type: CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.version_journal
    ADD CONSTRAINT version_journal_pkey PRIMARY KEY (id);


--
-- Name: ix_dataset_columns_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_dataset_columns_id ON public.dataset_columns USING btree (id);


--
-- Name: ix_dataset_versions_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_dataset_versions_id ON public.dataset_versions USING btree (id);


--
-- Name: ix_datasets_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_datasets_id ON public.datasets USING btree (id);


--
-- Name: ix_execution_rules_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_execution_rules_id ON public.execution_rules USING btree (id);


--
-- Name: ix_executions_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_executions_id ON public.executions USING btree (id);


--
-- Name: ix_exports_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_exports_id ON public.exports USING btree (id);


--
-- Name: ix_fixes_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_fixes_id ON public.fixes USING btree (id);


--
-- Name: ix_issues_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_issues_id ON public.issues USING btree (id);


--
-- Name: ix_rule_columns_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_rule_columns_id ON public.rule_columns USING btree (id);


--
-- Name: ix_rules_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_rules_id ON public.rules USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_version_journal_id; Type: INDEX; Schema: public; Owner: dh_user
--

CREATE INDEX ix_version_journal_id ON public.version_journal USING btree (id);


--
-- Name: dataset_columns dataset_columns_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.dataset_columns
    ADD CONSTRAINT dataset_columns_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id);


--
-- Name: dataset_versions dataset_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.dataset_versions
    ADD CONSTRAINT dataset_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: dataset_versions dataset_versions_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.dataset_versions
    ADD CONSTRAINT dataset_versions_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id);


--
-- Name: datasets datasets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: execution_rules execution_rules_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.execution_rules
    ADD CONSTRAINT execution_rules_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.executions(id);


--
-- Name: execution_rules execution_rules_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.execution_rules
    ADD CONSTRAINT execution_rules_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(id);


--
-- Name: executions executions_dataset_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_dataset_version_id_fkey FOREIGN KEY (dataset_version_id) REFERENCES public.dataset_versions(id);


--
-- Name: executions executions_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.executions
    ADD CONSTRAINT executions_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.users(id);


--
-- Name: exports exports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.exports
    ADD CONSTRAINT exports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: exports exports_dataset_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.exports
    ADD CONSTRAINT exports_dataset_version_id_fkey FOREIGN KEY (dataset_version_id) REFERENCES public.dataset_versions(id);


--
-- Name: exports exports_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.exports
    ADD CONSTRAINT exports_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.executions(id);


--
-- Name: fixes fixes_fixed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.fixes
    ADD CONSTRAINT fixes_fixed_by_fkey FOREIGN KEY (fixed_by) REFERENCES public.users(id);


--
-- Name: fixes fixes_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.fixes
    ADD CONSTRAINT fixes_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id);


--
-- Name: issues issues_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.executions(id);


--
-- Name: issues issues_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(id);


--
-- Name: rule_columns rule_columns_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rule_columns
    ADD CONSTRAINT rule_columns_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.dataset_columns(id);


--
-- Name: rule_columns rule_columns_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rule_columns
    ADD CONSTRAINT rule_columns_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.rules(id);


--
-- Name: rules rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.rules
    ADD CONSTRAINT rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: version_journal version_journal_dataset_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dh_user
--

ALTER TABLE ONLY public.version_journal
    ADD CONSTRAINT version_journal_dataset_version_id_fkey FOREIGN KEY (dataset_version_id) REFERENCES public.dataset_versions(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lHIJdjwMKRJzVGRdd8RZrAtTj4VN13acJTzdhdQdiLQGXPhiGLlpEoGscwPLgst

