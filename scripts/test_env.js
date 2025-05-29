require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);