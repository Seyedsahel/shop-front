// server/utils/mocks/offer.mock.ts
export const mockSpecialOfferResponse: SpecialOfferResponse = {
  endsAt: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
  products: [
    {
      id: 'o1', productTypeId: 'x', name: 'ژل بهداشتی پروبیوتیک بانوان', slug: 'probiotic-gel',
      thumbnailUrl: null, imageUrl: 'https://placehold.co/300x300/png',
      brandId: '', description: '', basePrice: 298000,
      price: { original: 298000, final: 298000, discount: 0, discountPercent: 0 },
      stock: 10, createdAt: 0, updatedAt: 0,
    },
    {
      id: 'o2', productTypeId: 'x', name: 'پودر بتا آلانین بی پی آی', slug: 'beta-alanine',
      thumbnailUrl: null, imageUrl: 'https://placehold.co/300x300/png',
      brandId: '', description: '', basePrice: 1950000,
      price: { original: 1950000, final: 1950000, discount: 0, discountPercent: 0 },
      stock: 10, createdAt: 0, updatedAt: 0,
    },
    // ...same fields for the other two
  ],
}
