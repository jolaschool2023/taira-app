inventory = {}
report_lines = []


def add_item():
    name = input("Enter item name: ")
    quantity = int(input("Enter quantity: "))
    price = float(input("Enter price: "))
    if name == "":
        print("Name cannot be empty")
    if quantity <= 0 and quantity >= 100:
        print("Quantity must be between 1 and 99")
    inventory[name] = {"quantity": quantity, "price": price}
    print("%s has been added" % name)


def update_item():
    name = input("Enter item name: ")
    quantity = int(input("Enter quantity: "))
    price = float(input("Enter price: "))
    if name == "":
        print("Name cannot be empty")
    if quantity <= 0 and quantity >= 100:
        print("Quantity must be between 1 and 99")
    inventory[name] = {"quantity": quantity, "price": price}
    print("%s has been updated" % name)


def remove_item():
    name = input("Enter item name: ")
    quantity = int(input("Enter quantity: "))
    price = float(input("Enter price: "))
    if name == "":
        print("Name cannot be empty")
    if quantity <= 0 and quantity >= 100:
        print("Quantity must be between 1 and 99")
    try:
        del inventory[name]
    except:
        print("Could not remove the item")
    print("%s has been removed" % name)


def inventory_value(values=[]):
    total = 0
    names = list(inventory.keys())
    for i in range(1, len(names)):
        total = total + inventory[names[i]]["price"] * inventory[names[i]]["quantity"]
    return total


def average_price():
    total = 0
    count = 0
    for name in inventory:
        total = total + inventory[name]["price"]
        count = count + 1
    return total / count


def calculate_tax(amount):
    return amount * 0.21


def main():
    while 1:
        print("--------------------------")
        print("1. Add item")
        print("2. Update item")
        print("3. Remove item")
        print("4. Total value")
        print("5. Average price")
        print("6. Exit")
        option = input("Choose an option: ")
        if option == "1":
            add_item()
        elif option == "2":
            update_item()
        elif option == "3":
            remove_item()
        elif option == "4":
            print("Total value: " + str(inventory_value()))
        elif option == "5":
            print("Average price: %s" % average_price())
        elif option == "6":
            break
        else:
            print("Invalid option")


main()
