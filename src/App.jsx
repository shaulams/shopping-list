import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { db } from './firebase';

// Categories with Hebrew labels and emoji icons
const CATEGORIES = [
  { id: 'produce', label: 'ירקות ופירות', emoji: '🥦' },
  { id: 'meat', label: 'בשר ועוף', emoji: '🥩' },
  { id: 'dairy', label: 'חלב וגבינות', emoji: '🧀' },
  { id: 'bakery', label: 'לחם ומאפים', emoji: '🍞' },
  { id: 'pantry', label: 'מזווה', emoji: '🥫' },
  { id: 'frozen', label: 'קפואים', emoji: '🧊' },
  { id: 'beverages', label: 'שתייה', emoji: '🥤' },
  { id: 'cleaning', label: 'ניקיון', emoji: '🧹' },
  { id: 'personal', label: 'טיפוח', emoji: '🧴' },
  { id: 'other', label: 'אחר', emoji: '🛒' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// Generate a short list code (6 chars)
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getListCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('list') || null;
}

export default function App() {
  const [listCode, setListCode] = useState(() => getListCodeFromUrl() || null);
  const [inputCode, setInputCode] = useState('');
  const [items, setItems] = useState({});
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const inputRef = useRef(null);

  // Listen to Firebase
  useEffect(() => {
    if (!listCode) return;
    const itemsRef = ref(db, `lists/${listCode}/items`);
    const unsub = onValue(itemsRef, (snapshot) => {
      setItems(snapshot.val() || {});
    });
    return () => unsub();
  }, [listCode]);

  // Create a new list
  function createNewList() {
    const code = generateCode();
    const listRef = ref(db, `lists/${code}`);
    set(listRef, {
      createdAt: Date.now(),
      items: {},
    }).then(() => {
      setListCode(code);
      const url = new URL(window.location.href);
      url.searchParams.set('list', code);
      window.history.replaceState({}, '', url.toString());
    });
  }

  // Join an existing list
  function joinList() {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setListCode(code);
    const url = new URL(window.location.href);
    url.searchParams.set('list', code);
    window.history.replaceState({}, '', url.toString());
    setShowJoin(false);
  }

  // Add item
  function addItem(e) {
    e.preventDefault();
    const text = newItemText.trim();
    if (!text || !listCode) return;
    const itemsRef = ref(db, `lists/${listCode}/items`);
    push(itemsRef, {
      text,
      category: newItemCategory,
      purchased: false,
      addedAt: Date.now(),
    });
    setNewItemText('');
    inputRef.current?.focus();
  }

  // Toggle purchased
  function toggleItem(id, current) {
    update(ref(db, `lists/${listCode}/items/${id}`), {
      purchased: !current,
    });
  }

  // Remove item
  function removeItem(id) {
    remove(ref(db, `lists/${listCode}/items/${id}`));
  }

  // Clear all purchased
  function clearPurchased() {
    const toClear = Object.entries(items)
      .filter(([, v]) => v.purchased)
      .map(([id]) => id);
    toClear.forEach(id => removeItem(id));
  }

  // Copy share link
  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?list=${listCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Filter items
  const filteredItems = Object.entries(items).filter(([, v]) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'purchased') return v.purchased;
    return v.category === activeCategory;
  });

  // Group by category for display
  const categoriesWithItems = CATEGORIES.filter(cat =>
    Object.values(items).some(item => item.category === cat.id)
  );

  const totalItems = Object.keys(items).length;
  const purchasedCount = Object.values(items).filter(v => v.purchased).length;

  // Landing page
  if (!listCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-green-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">רשימת קניות משפחתית</h1>
          <p className="text-gray-500 mb-8 text-sm">סנכרון בזמן אמת עם בן/בת הזוג</p>

          <button
            onClick={createNewList}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl mb-4 transition-colors text-lg"
          >
            ✨ צור רשימה חדשה
          </button>

          <button
            onClick={() => setShowJoin(!showJoin)}
            className="w-full border-2 border-green-600 text-green-700 font-bold py-3 px-6 rounded-xl transition-colors text-lg hover:bg-green-50"
          >
            🔗 הצטרף לרשימה קיימת
          </button>

          {showJoin && (
            <div className="mt-4">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="הכנס קוד רשימה (6 תווים)"
                className="w-full border-2 border-gray-300 rounded-xl p-3 text-center text-lg tracking-widest mb-3 focus:border-green-500 outline-none"
                maxLength={6}
              />
              <button
                onClick={joinList}
                disabled={inputCode.length < 3}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                הצטרף
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-3 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">🛒 רשימת קניות</h1>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                {copied ? '✅ הועתק!' : `📋 שתף (${listCode})`}
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-green-900 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: totalItems > 0 ? `${(purchasedCount / totalItems) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-green-200">
              {purchasedCount}/{totalItems}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Add item form */}
        <form onSubmit={addItem} className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              placeholder="הוסף מוצר..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-green-500 outline-none"
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 rounded-xl font-bold transition-colors text-xl"
            >
              +
            </button>
          </div>

          {/* Category selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-row-reverse">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setNewItemCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  newItemCategory === cat.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 flex-row-reverse">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
            }`}
          >
            הכל ({totalItems})
          </button>
          {categoriesWithItems.map(cat => {
            const count = Object.values(items).filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
          {purchasedCount > 0 && (
            <button
              onClick={() => setActiveCategory('purchased')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'purchased'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
              }`}
            >
              ✅ נקנו ({purchasedCount})
            </button>
          )}
        </div>

        {/* Items list */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🛍️</div>
            <p className="text-lg">הרשימה ריקה</p>
            <p className="text-sm">הוסף מוצרים למעלה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems
              .sort((a, b) => {
                // Sort: unpurchased first, then by category, then by time
                if (a[1].purchased !== b[1].purchased) return a[1].purchased ? 1 : -1;
                if (a[1].category !== b[1].category) return a[1].category.localeCompare(b[1].category);
                return (a[1].addedAt || 0) - (b[1].addedAt || 0);
              })
              .map(([id, item]) => {
                const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
                return (
                  <div
                    key={id}
                    className={`bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 transition-all ${
                      item.purchased ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(id, item.purchased)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        item.purchased
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {item.purchased && '✓'}
                    </button>

                    {/* Category emoji */}
                    <span className="text-xl flex-shrink-0">{cat.emoji}</span>

                    {/* Text */}
                    <span
                      className={`flex-1 text-base ${
                        item.purchased ? 'line-through text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      {item.text}
                    </span>

                    {/* Category badge */}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {cat.label}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(id)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg flex-shrink-0 w-7 h-7 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* Clear purchased button */}
        {purchasedCount > 0 && (
          <button
            onClick={clearPurchased}
            className="w-full mt-4 py-3 text-sm text-red-500 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            🗑️ הסר פריטים שנקנו ({purchasedCount})
          </button>
        )}

        {/* List code footer */}
        <div className="mt-6 text-center text-gray-400 text-xs pb-4">
          <p>קוד הרשימה שלך: <span className="font-bold tracking-widest text-gray-600">{listCode}</span></p>
          <p className="mt-1">שתף עם בן/בת הזוג כדי לסנכרן בזמן אמת</p>
          <button
            onClick={() => {
              setListCode(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('list');
              window.history.replaceState({}, '', url.toString());
            }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            פתח רשימה אחרת
          </button>
        </div>
      </div>
    </div>
  );
}
