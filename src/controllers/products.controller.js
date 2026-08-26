import { products, categories } from '../data/mockData.js';

let productStore = [...products];

// Get all products with optional query filtering & search
export const getProducts = (req, res) => {
  const { search, categoryId, status } = req.query;

  let filtered = [...productStore];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    );
  }

  if (categoryId) {
    filtered = filtered.filter(p => p.categoryId === categoryId);
  }

  if (status) {
    filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered
  });
};

// Get product by ID or Barcode
export const getProductById = (req, res) => {
  const { id } = req.params;
  const product = productStore.find(p => p.id === id || p.barcode === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product with ID or barcode '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    data: product
  });
};

// Create a new product
export const createProduct = (req, res) => {
  const { name, categoryId, sellingPrice, mrp, costPrice, stock, barcode, unit, taxRate } = req.body;

  if (!name || !sellingPrice) {
    return res.status(400).json({
      success: false,
      message: 'Product name and sellingPrice are required fields.'
    });
  }

  const category = categories.find(c => c.id === categoryId);

  const newProduct = {
    id: `prod-${Date.now()}`,
    barcode: barcode || `${Date.now()}`,
    name,
    categoryId: categoryId || 'cat-1',
    categoryName: category ? category.name : 'General',
    mrp: Number(mrp) || Number(sellingPrice),
    sellingPrice: Number(sellingPrice),
    costPrice: Number(costPrice) || 0,
    stock: Number(stock) || 0,
    unit: unit || 'pcs',
    taxRate: Number(taxRate) || 0,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  productStore.push(newProduct);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: newProduct
  });
};

// Update an existing product
export const updateProduct = (req, res) => {
  const { id } = req.params;
  const index = productStore.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Product with ID '${id}' not found`
    });
  }

  const updatedProduct = {
    ...productStore[index],
    ...req.body,
    id: productStore[index].id, // Prevent overwriting ID
    updatedAt: new Date().toISOString()
  };

  productStore[index] = updatedProduct;

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
};

// Delete a product
export const deleteProduct = (req, res) => {
  const { id } = req.params;
  const initialLength = productStore.length;
  productStore = productStore.filter(p => p.id !== id);

  if (productStore.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: `Product with ID '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Product '${id}' deleted successfully`
  });
};
