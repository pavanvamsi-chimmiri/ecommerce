"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  minPrice?: number;
  maxPrice?: number;
}

export function Filters({ minPrice = 0, maxPrice = 500 }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const qParam = params.get("q") ?? "";
  const minParam = Number(params.get("min") ?? minPrice);
  const maxParam = Number(params.get("max") ?? maxPrice);
  const sortParam = params.get("sort") ?? "newest";
  const stockParam = params.get("stock") === "1";

  const [q, setQ] = useState(qParam);
  const [range, setRange] = useState<[number, number]>([
    isFinite(minParam) ? minParam : minPrice,
    isFinite(maxParam) ? maxParam : maxPrice,
  ]);
  const [sort, setSort] = useState(sortParam);
  const [inStock, setInStock] = useState(stockParam);

  useEffect(() => {
    setQ(qParam);
    setRange([
      isFinite(minParam) ? minParam : minPrice,
      isFinite(maxParam) ? maxParam : maxPrice,
    ]);
    setSort(sortParam);
    setInStock(stockParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, minParam, maxParam, sortParam, stockParam]);

  const apply = () => {
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim()); else next.delete("q");
    next.set("min", String(range[0]));
    next.set("max", String(range[1]));
    if (sort && sort !== "newest") next.set("sort", sort); else next.delete("sort");
    if (inStock) next.set("stock", "1"); else next.delete("stock");
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  };

  const clear = () => {
    const next = new URLSearchParams(params.toString());
    ["q", "min", "max", "sort", "stock", "page"].forEach((k) => next.delete(k));
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="q">Search</Label>
        <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
      </div>

      <div className="space-y-2">
        <Label>Price range (${range[0]} - ${range[1]})</Label>
        <Slider
          defaultValue={range}
          value={range}
          onValueChange={(v) => setRange([v[0] ?? minPrice, v[1] ?? maxPrice])}
          min={minPrice}
          max={maxPrice}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Sort</Label>
        <select
          id="sort"
          className="w-full border rounded-md h-9 px-3 bg-background"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="stock"
          type="checkbox"
          className="h-4 w-4"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
        />
        <Label htmlFor="stock">In stock only</Label>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={apply}>Apply</Button>
        <Button variant="outline" className="flex-1" onClick={clear}>Clear</Button>
      </div>
    </div>
  );
}


