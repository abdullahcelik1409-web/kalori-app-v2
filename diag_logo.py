from PIL import Image

def find_logo():
    input_path = "C:/Users/abdul/.gemini/antigravity/brain/3108cbbe-7e53-4109-8b3d-a5e37f85bc69/media__1771016076116.png"
    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    
    # Bounding box bulma (Siyah/Koyu yeşil olmayan pikseller)
    # Background rengi genellikle (10-20, 30-40, 30-40) civarı
    bbox = img.getbbox() # PIL'in kendi bbox'ı sıfır olmayanları bulur
    print(f"PIL Bbox: {bbox}")
    
    # Manuel tarama (Parlaklık eşiği ile)
    pixels = img.load()
    min_x, min_y = w, h
    max_x, max_y = 0, 0
    found = False
    
    threshold = 40 # Karanlık arka plandan ayırmak için
    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            if r > threshold or g > threshold or b > threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
                found = True
    
    if found:
        print(f"Detected Bbox: ({min_x}, {min_y}, {max_x}, {max_y})")
        print(f"Center Y: {(min_y + max_y) // 2}")
    else:
        print("No logo detected with threshold!")

if __name__ == "__main__":
    find_logo()
