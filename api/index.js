import { createClient } from '@supabase/supabase-js';

// 1. Connect to your Supabase Database (We will add these keys in Vercel later)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 2. Generate a random 6-character code (e.g., "8A2X9B")
  const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // 3. Save the code to your Supabase 'coupons' table
  const { error } = await supabase
    .from('coupons')
    .insert([{ code: uniqueCode }]);

 if (error) {
  return res.status(500).json({ 
    error: 'Failed to save coupon to database.', 
    supabase_details: error,
    url_status: supabaseUrl ? "URL is loaded" : "URL is MISSING",
    key_status: supabaseKey ? "Key is loaded" : "Key is MISSING"
  });
}

  // 4. Create the Cloudinary Image URL
  // REPLACE "YOUR_CLOUD_NAME" with your actual Cloudinary name!
  const cloudName = 'YOUR_CLOUD_NAME'; 
  
  // This URL tells Cloudinary to put the uniqueCode on top of blank_coupon.png
  const cloudinaryUrl = `https://res.cloudinary.com/dvgje8p9s/image/upload/l_text:Arial_35_bold:${uniqueCode},g_south_west,x_80,y_70/v1772260712/blank_coupon_kwdgvu.png`;

  // 5. Build the simple webpage the user will see
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Coupon</title>
      <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; font-family: sans-serif; margin: 0; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 90%; }
        img { max-width: 100%; border-radius: 8px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Here is your unique coupon!</h2>
        <p>Show this code at the counter to redeem.</p>
        <img src="${cloudinaryUrl}" alt="Coupon Code" />
      </div>
    </body>
    </html>
  `;

  // 6. Send the webpage to the user's phone
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}


