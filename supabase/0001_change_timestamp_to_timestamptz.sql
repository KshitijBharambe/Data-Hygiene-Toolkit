
ALTER TABLE public.dataset_versions ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.datasets ALTER COLUMN uploaded_at TYPE timestamp with time zone USING uploaded_at AT TIME ZONE 'UTC';
ALTER TABLE public.executions ALTER COLUMN started_at TYPE timestamp with time zone USING started_at AT TIME ZONE 'UTC';
ALTER TABLE public.executions ALTER COLUMN finished_at TYPE timestamp with time zone USING finished_at AT TIME ZONE 'UTC';
ALTER TABLE public.exports ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.fixes ALTER COLUMN fixed_at TYPE timestamp with time zone USING fixed_at AT TIME ZONE 'UTC';
ALTER TABLE public.issues ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.rules ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.rules ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.users ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.users ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE public.version_journal ALTER COLUMN occurred_at TYPE timestamp with time zone USING occurred_at AT TIME ZONE 'UTC';
