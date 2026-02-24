from PIL import Image, ImageDraw

def generate_transparent_v11_logo():
    size = 1024
    # Tamamen şeffaf arka plan için RGBA (0, 0, 0, 0)
    brand_color = (16, 185, 129, 255) # #10B981 (Emerald Green + Full Opacity)
    
    # RGBA mode
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    padding = 200
    stroke = 70
    
    # Denge sembolü (Şeffaf zemin üzerine yeşil çizgiler)
    draw.arc([padding, padding, size - padding, size - padding], 
             start=140, end=320, fill=brand_color, width=stroke)
    draw.arc([padding + 50, padding + 50, size - padding - 50, size - padding - 50], 
             start=500, end=320, fill=brand_color, width=stroke)

    dot_radius = 45
    draw.ellipse([center - dot_radius, center - dot_radius, center + dot_radius, center + dot_radius], 
                 fill=brand_color)

    # Önbellek sorunları için yeni isim
    output_path = "c:/Users/abdul/kalori sayma uygulaması/rebalance-app/assets/rebalance_final_v11_transparent.png"
    img.save(output_path, "PNG")
    
    # Favicon'u da şeffaf yap
    favicon_path = "c:/Users/abdul/kalori sayma uygulaması/rebalance-app/assets/favicon.png"
    img.save(favicon_path, "PNG")
    
    print(f"v11 Transparent Logo Sentezlendi: {output_path}")

if __name__ == "__main__":
    generate_transparent_v11_logo()
