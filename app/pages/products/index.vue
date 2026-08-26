<template>
<!-- category/listing page -->
<div class="flex gap-3 mb-4 lg:hidden">
  <ProductSortBar />
  <FilterMobileButton class="flex-1" />
</div>

<div class="hidden lg:flex max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8  gap-6">
  <FilterSidebar />
  <div class="flex-1">
    <ProductSortBar />
    <!-- product grid -->
  </div>
</div>
</template>