'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, CartItem } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ShoppingCart, User, LogOut, Plus, Minus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    checkUser();
    loadCart();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email || '', id: session.user.id });
        checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({ email: session.user.email || '', id: session.user.id });
      await checkAdminStatus(session.user.id);
    }
    setLoading(false);
  };

  const checkAdminStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profile?.is_admin) {
      setIsAdmin(true);
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      const newCart = cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newCart);
    } else {
      saveCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      )
      .filter((item) => item.quantity > 0);
    saveCart(newCart);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    window.location.reload();
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                PodStore
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Admin Button */}
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              )}

              {/* Carrinho */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  onClick={() => {
                    const cartSection = document.getElementById('cart-section');
                    cartSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getCartCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {getCartCount()}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* User Menu */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.email.split('@')[0]}
                  </span>
                  <Button variant="outline" size="icon" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Os Melhores Pods do Mercado
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Sabores incríveis, qualidade premium e entrega rápida. Descubra sua experiência perfeita.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="px-4 py-2 text-sm cursor-pointer hover:bg-purple-50 transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-blue-600">
                    {product.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cart Section */}
      <section id="cart-section" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Seu Carrinho</h2>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <Card key={item.product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-gray-500">{item.product.category}</p>
                          <p className="text-purple-600 font-bold mt-1">
                            R$ {item.product.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-3xl font-bold text-purple-600">
                      R$ {getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                    onClick={() => {
                      if (user) {
                        router.push('/checkout');
                      } else {
                        router.push('/login');
                      }
                    }}
                  >
                    {user ? 'Finalizar Compra' : 'Entrar para Finalizar'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 PodStore. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
