
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://gsyqmgymkajiccoybdoe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFtZ3lta2FqaWNjb3liZG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDcyMzcsImV4cCI6MjA1NjY4MzIzN30.s_qZYPayLf5lwcYZeaQnhgyyUcOgCrcHMd2lst-OJuQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
