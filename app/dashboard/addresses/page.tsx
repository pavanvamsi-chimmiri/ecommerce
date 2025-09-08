"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { showToast } from "@/lib/toast";

interface Address {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phone: "",
    isDefault: false,
  });

  // Mock data for demonstration
  useEffect(() => {
    setAddresses([
      {
        id: "1",
        name: "John Doe",
        line1: "123 Main Street",
        line2: "Apt 4B",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "United States",
        phone: "+1 (555) 123-4567",
        isDefault: true,
      },
      {
        id: "2",
        name: "John Doe",
        line1: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90210",
        country: "United States",
        phone: "+1 (555) 987-6543",
        isDefault: false,
      },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingAddress) {
        // Update existing address
        setAddresses(prev => {
          const normalized = (a: Address | typeof formData) => (
            `${(a.name||"").trim().toLowerCase()}|${(a.line1||"").trim().toLowerCase()}|${(a.line2||"").trim().toLowerCase()}|${(a.city||"").trim().toLowerCase()}|${(a.state||"").trim().toLowerCase()}|${(a.postalCode||"").trim().toLowerCase()}|${(a.country||"").trim().toLowerCase()}|${(a.phone||"").replace(/\D+/g, "")}`
          );
          const updated = { ...formData, id: editingAddress.id } as Address;
          const key = normalized(updated);
          const dedup = prev
            .map(addr => addr.id === editingAddress.id ? updated : addr)
            .filter((addr, idx, arr) => arr.findIndex(x => normalized(x) === normalized(addr)) === idx);
          return dedup;
        });
        showToast({
          title: "Address updated",
          description: "Your address has been updated successfully.",
        });
      } else {
        // Add new address
        const newAddress = { ...formData, id: Date.now().toString() } as Address;
        setAddresses(prev => {
          const normalized = (a: Address) => (
            `${(a.name||"").trim().toLowerCase()}|${(a.line1||"").trim().toLowerCase()}|${(a.line2||"").trim().toLowerCase()}|${(a.city||"").trim().toLowerCase()}|${(a.state||"").trim().toLowerCase()}|${(a.postalCode||"").trim().toLowerCase()}|${(a.country||"").trim().toLowerCase()}|${(a.phone||"").replace(/\D+/g, "")}`
          );
          const next = [...prev, newAddress];
          return next.filter((addr, idx, arr) => arr.findIndex(x => normalized(x) === normalized(addr)) === idx);
        });
        showToast({
          title: "Address added",
          description: "Your new address has been added successfully.",
        });
      }
      
      resetForm();
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state || "",
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || "",
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      showToast({
        title: "Address deleted",
        description: "The address has been removed from your account.",
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    })));
    showToast({
      title: "Default address updated",
      description: "Your default address has been changed.",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      phone: "",
      isDefault: false,
    });
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-gray-600 mt-2">
            Manage your delivery addresses
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Address Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </CardTitle>
            <CardDescription>
              {editingAddress ? "Update your address information" : "Add a new delivery address"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line1">Address Line 1</Label>
                <Input
                  id="line1"
                  name="line1"
                  value={formData.line1}
                  onChange={handleChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  name="line2"
                  value={formData.line2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="ZIP/Postal code"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default address</Label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No addresses saved</h3>
            <p className="text-muted-foreground mb-6">
              Add your first address to make checkout faster and easier.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isDefault ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {address.name}
                    {address.isDefault && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                  {address.phone && <p>Phone: {address.phone}</p>}
                </div>
                
                {!address.isDefault && (
                  <div className="pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="w-full"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Set as Default
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

