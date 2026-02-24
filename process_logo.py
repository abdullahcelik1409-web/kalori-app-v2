from PIL import Image

def process_isolated_logo():
    # Kullanıcının "garanti olsun" diye son attığı dosya
    input_path = "C:/Users/abdul/.gemini/antigravity/brain/3108cbbe-7e53-4109-8b3d-a5e37f85bc69/media__1771018080168.jpg"
    # Kesin çözüm ismi
    output_path = "c:/Users/abdul/kalori sayma uygulaması/rebalance-app/assets/rebalance_ultimate_logo.png"
    
    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    pixels = img.load()
    
    # 1. PARAZİT TESPİTİ VE KIRPMA:
    # Sol tarafta (157, 172, 169) gibi açık pikseller var. 
    # Siyah logo alanını bulmak için pikselleri tarayalım (Arka plan < 30 ise siyahtır)
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    
    # Siyah arka planlı logoyu buluyoruz (Piksellerin koyu olduğu yerleri bulalım)
    # Aslında logonun kendisi parlıyor (Center: 26, 194, 169). 
    # Arka plan ise koyu (13, 19, 19).
    # Önceki tespitte (0,0) hatalıydı. 
    # Logoyu kısıtlayan en geniş koyu kareyi bulalım.
    
    # Pratik çözüm: Kenarlardan 10 piksel daha cömertçe kırpalım (Parazitleri atmak için)
    # Çünkü 165x165 çok küçük, 10 piksel kayıp detayı bozmaz ama beyazlığı kesin bitirir.
    margin = 8
    cropped = img.crop((margin, margin, w - margin, h - margin))
    
    # 2. 1024x1024'e ölçeklendir
    final_img = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # 3. Kaydet
    final_img.save(output_path, "PNG")
    print(f"Ultimate Logo İşlendi: {output_path}")
    print(f"Yeni Köşe (0,0): {final_img.getpixel((0,0))}")

if __name__ == "__main__":
    process_isolated_logo()
