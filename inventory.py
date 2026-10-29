"""Inventory management with validated operations and a command-line menu."""

MIN_QUANTITY = 1
MAX_QUANTITY = 99


def read_name(prompt="Enter item name: "):
    """Read a non-empty item name from the user."""
    name = input(prompt).strip()
    while not name:
        print("Name cannot be empty.")
        name = input(prompt).strip()
    return name


def read_number(prompt, convert, valid, invalid_message):
    """Read and convert a value until it satisfies the validation function."""
    while True:
        raw = input(prompt).strip()
        try:
            value = convert(raw)
        except ValueError:
            print("That is not a valid number.")
            continue
        if not valid(value):
            print(invalid_message)
            continue
        return value


def read_int(prompt):
    """Read a whole number inside the allowed quantity range."""
    return read_number(
        prompt,
        int,
        lambda value: MIN_QUANTITY <= value <= MAX_QUANTITY,
        f"Quantity must be between {MIN_QUANTITY} and {MAX_QUANTITY}.",
    )


def read_price(prompt="Enter price: "):
    """Read a non-negative price from the user."""
    return read_number(prompt, float, lambda price: price >= 0, "Price cannot be negative.")


def add_item(inventory, name, quantity, price):
    """Add an item or accumulate its stock; returns False on invalid data."""
    if not name:
        return False
    if quantity < MIN_QUANTITY or quantity > MAX_QUANTITY:
        return False
    item = inventory.setdefault(name, {"quantity": 0, "price": 0.0})
    item["quantity"] += quantity
    item["price"] = price
    return True


def sell_item(inventory, name, quantity):
    """Remove a quantity from an item; returns False when there is not enough stock."""
    item = inventory.get(name)
    if item is None or item["quantity"] < quantity:
        return False
    item["quantity"] -= quantity
    return True


def remove_item(inventory, name):
    """Delete an item; returns False when it does not exist."""
    if name not in inventory:
        return False
    del inventory[name]
    return True


def list_items(inventory):
    """Print every item together with its stock level."""
    for name, item in inventory.items():
        print(f"{name}: {item['quantity']} units at {item['price']}")


def total_value(inventory):
    """Return the combined value of the whole stock."""
    return sum(item["price"] * item["quantity"] for item in inventory.values())


def average_price(inventory):
    """Return the average price of all items, or 0.0 when the inventory is empty."""
    prices = [item["price"] for item in inventory.values()]
    if not prices:
        return 0.0
    return sum(prices) / len(prices)


def main():
    """Run the interactive inventory menu."""
    inventory = {}
    while True:
        print("-" * 26)
        print("1. Add item")
        print("2. Sell item")
        print("3. Remove item")
        print("4. List items")
        print("5. Total value")
        print("6. Average price")
        print("7. Exit")
        option = input("Choose an option: ").strip()
        if option == "1":
            add_item(inventory, read_name(), read_int("Enter quantity: "), read_price())
        elif option == "2":
            sold = sell_item(inventory, read_name(), read_int("Enter quantity to sell: "))
            if not sold:
                print("Not enough stock in the inventory.")
        elif option == "3":
            remove_item(inventory, read_name())
        elif option == "4":
            list_items(inventory)
        elif option == "5":
            print(f"Total value: {total_value(inventory)}")
        elif option == "6":
            print(f"Average price: {average_price(inventory)}")
        elif option == "7":
            break
        else:
            print("Invalid option.")


if __name__ == "__main__":
    main()