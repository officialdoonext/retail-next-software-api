import { categories } from '../data/mockData.js';

let categoryStore = [...categories];

export const getCategories = (req, res) => {
  res.status(200).json({
    success: true,
    count: categoryStore.length,
    data: categoryStore
  });
};

export const getCategoryById = (req, res) => {
  const { id } = req.params;
  const category = categoryStore.find(c => c.id === id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: `Category with ID '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    data: category
  });
};

export const createCategory = (req, res) => {
  const { name, code, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required.'
    });
  }

  const newCategory = {
    id: `cat-${Date.now()}`,
    name,
    code: code || name.slice(0, 3).toUpperCase(),
    description: description || '',
    itemCount: 0,
    createdAt: new Date().toISOString()
  };

  categoryStore.push(newCategory);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: newCategory
  });
};

export const updateCategory = (req, res) => {
  const { id } = req.params;
  const index = categoryStore.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: `Category with ID '${id}' not found`
    });
  }

  const updatedCategory = {
    ...categoryStore[index],
    ...req.body,
    id: categoryStore[index].id,
    updatedAt: new Date().toISOString()
  };

  categoryStore[index] = updatedCategory;

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: updatedCategory
  });
};

export const deleteCategory = (req, res) => {
  const { id } = req.params;
  const initialLength = categoryStore.length;
  categoryStore = categoryStore.filter(c => c.id !== id);

  if (categoryStore.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: `Category with ID '${id}' not found`
    });
  }

  res.status(200).json({
    success: true,
    message: `Category '${id}' deleted successfully`
  });
};
