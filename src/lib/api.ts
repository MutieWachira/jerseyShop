export type Product = {
    id: string;
    name: string;
    team: string;
    price: number;
    description?: string | null;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type ProductsResponse = {
    data: Product[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        q: string;
    };
};

export async function fetchProducts(params:{
    page?: number;
    limit?: number;
    q?: string;
}): Promise<ProductsResponse> {
    const sp = new URLSearchParams();

    if ( params.page) sp.set("page", String(params.page));
    if ( params.limit) sp.set("limit", String(params.limit));
    if ( params.q) sp.set("q", params.q);

    const res = await fetch(`/api/products?${sp.toString()}`);
    if (!res.ok) {
        throw new Error("Failed to fetch products");
    }
    return res.json();
}
