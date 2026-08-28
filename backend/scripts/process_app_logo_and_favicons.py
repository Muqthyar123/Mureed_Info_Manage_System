import os
import sys
from PIL import Image

src_image_path = r"C:\Users\Shaik Meera Muqthyar\.gemini\antigravity\brain\bea38260-06f1-472c-a983-1703c1b8d45e\.user_uploaded\media_1787928918894.jpg"
public_dir = r"C:\Users\Shaik Meera Muqthyar\OneDrive\Desktop\AKA\Mureed_Info_Manage_System(MIS)\frontend_MIS\public"

print(f"Loading Image 2 from: {src_image_path}")
img = Image.open(src_image_path)

# Make image square by embedding inside square transparent/white background if needed
width, height = img.size
max_dim = max(width, height)
square_img = Image.new("RGBA", (max_dim, max_dim), (255, 255, 255, 0))
offset = ((max_dim - width) // 2, (max_dim - height) // 2)
square_img.paste(img, offset)

# Save high-res logo.png
logo_path = os.path.join(public_dir, "logo.png")
square_img.save(logo_path, "PNG")
print(f"Saved high-res app logo to {logo_path}")

# Save favicon.png (32x32)
fav_png_path = os.path.join(public_dir, "favicon.png")
fav_32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save(fav_png_path, "PNG")
print(f"Saved favicon.png to {fav_png_path}")

# Save favicon.ico (multi-res 16, 32, 48, 64)
fav_ico_path = os.path.join(public_dir, "favicon.ico")
square_img.save(fav_ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print(f"Saved multi-resolution favicon.ico to {fav_ico_path}")

# Save apple-touch-icon.png (180x180)
apple_icon_path = os.path.join(public_dir, "apple-touch-icon.png")
fav_180 = square_img.resize((180, 180), Image.Resampling.LANCZOS)
fav_180.save(apple_icon_path, "PNG")
print(f"Saved apple-touch-icon.png to {apple_icon_path}")

print("Logo and Favicons generated successfully!")
