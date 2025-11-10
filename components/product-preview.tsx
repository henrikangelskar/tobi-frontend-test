import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface ProductPreviewProps {
  products: Product[];
}

export function ProductPreview({ products }: ProductPreviewProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 my-4">
      {products.map((product, index) => (
        <Card
          key={index}
          className="overflow-hidden hover:shadow-lg transition-shadow"
        >
          <a
            href={product.shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {product.imageUrl && (
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                {product.preOwned && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 bg-amber-100 text-amber-900"
                  >
                    Pre-owned
                  </Badge>
                )}
              </div>
            )}
            <CardHeader>
              <CardTitle className="line-clamp-2 text-base flex items-start justify-between gap-2">
                <span>{product.title}</span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
              </CardTitle>
              <CardDescription className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-foreground">
                  {product.price}
                </span>
                <span className="text-sm">{product.shopName}</span>
              </CardDescription>
            </CardHeader>
          </a>
        </Card>
      ))}
    </div>
  );
}
