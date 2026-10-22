// Public values only (the anon key is meant to be public). Never put the service_role key here.
module.exports = {
  SB_URL: process.env.SB_URL || 'https://avgmyzrikvtknknxnlpr.supabase.co',
  SB_KEY: process.env.SB_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z215enJpa3Z0a25rbnhubHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTgxMjEsImV4cCI6MjEwNzk3NDEyMX0.A7CSUt4HqPIqZcwmSd2adTrniVTJG9KzDZ5lHEvZUCE',
  SITE: process.env.SITE_URL || 'https://njtulundeurbanfeeds.com',
};
