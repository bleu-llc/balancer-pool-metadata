ALTER TABLE "gauge_snapshots" DROP CONSTRAINT "gauge_snapshots_timestamp_gauge_address_child_gauge_address_unique";--> statement-breakpoint
ALTER TABLE "gauge_snapshots" ADD CONSTRAINT "gauge_snapshots_timestamp_gauge_address_child_gauge_address_network_slug_unique" UNIQUE("timestamp","gauge_address","child_gauge_address","network_slug");