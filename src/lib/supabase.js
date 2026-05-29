import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmdzofqwogrhcggetrik.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZHpvZnF3b2dyaGNnZ2V0cmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDc4NjAsImV4cCI6MjA5NTYyMzg2MH0.IOVSAtq5fMPGtHulvGFnV-LrqR1HkRbGlS3MoAS6gbA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
