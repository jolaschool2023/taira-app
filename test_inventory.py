import unittest

import inventory


class InventoryTests(unittest.TestCase):
    def test_add_item(self):
        stock = {}
        self.assertTrue(inventory.add_item(stock, "apple", 5, 1.5))
        self.assertEqual(stock["apple"], {"quantity": 5, "price": 1.5})

    def test_add_item_rejects_empty_name(self):
        stock = {}
        self.assertFalse(inventory.add_item(stock, "", 5, 1.5))
        self.assertEqual(stock, {})

    def test_add_item_rejects_out_of_range_quantity_low(self):
        stock = {}
        self.assertFalse(inventory.add_item(stock, "apple", 0, 1.5))
        self.assertEqual(stock, {})

    def test_add_item_rejects_out_of_range_quantity_high(self):
        stock = {}
        self.assertFalse(inventory.add_item(stock, "apple", 100, 1.5))
        self.assertEqual(stock, {})

    def test_add_item_accumulates_stock(self):
        stock = {}
        inventory.add_item(stock, "apple", 3, 1.5)
        inventory.add_item(stock, "apple", 2, 1.8)
        self.assertEqual(stock["apple"]["quantity"], 5)
        self.assertEqual(stock["apple"]["price"], 1.8)

    def test_sell_item(self):
        stock = {"apple": {"quantity": 5, "price": 1.5}}
        self.assertTrue(inventory.sell_item(stock, "apple", 3))
        self.assertEqual(stock["apple"]["quantity"], 2)

    def test_sell_item_insufficient_stock_does_not_change(self):
        stock = {"apple": {"quantity": 2, "price": 1.5}}
        self.assertFalse(inventory.sell_item(stock, "apple", 3))
        self.assertEqual(stock["apple"]["quantity"], 2)

    def test_sell_item_unknown_item(self):
        self.assertFalse(inventory.sell_item({}, "apple", 1))

    def test_remove_item(self):
        stock = {"apple": {"quantity": 5, "price": 1.5}}
        self.assertTrue(inventory.remove_item(stock, "apple"))
        self.assertEqual(stock, {})

    def test_remove_item_missing(self):
        self.assertFalse(inventory.remove_item({}, "apple"))

    def test_total_value(self):
        stock = {
            "apple": {"quantity": 5, "price": 2.0},
            "banana": {"quantity": 3, "price": 1.0},
        }
        self.assertEqual(inventory.total_value(stock), 13.0)

    def test_total_value_empty_inventory(self):
        self.assertEqual(inventory.total_value({}), 0)

    def test_average_price(self):
        stock = {
            "apple": {"quantity": 5, "price": 2.0},
            "banana": {"quantity": 3, "price": 4.0},
        }
        self.assertEqual(inventory.average_price(stock), 3.0)

    def test_average_price_empty_inventory_is_safe(self):
        self.assertEqual(inventory.average_price({}), 0.0)


if __name__ == "__main__":
    unittest.main()