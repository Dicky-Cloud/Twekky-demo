import { createContext, useContext } from "react";

// Urutan komentar dipakai bersama oleh CommentThread (daftar utama) dan
// ReplyModal (daftar balasan), jadi disimpan di context.
export const SortContext = createContext({ sort: "top", setSort: () => {} });

const OPTIONS = [
  { key: "top", label: "Top" },
  { key: "recent", label: "Recent" },
];

const time = (c) => new Date(c.created_at).getTime();

// Recent = terbaru dulu. Top = paling banyak disukai, lalu paling banyak
// dibalas, lalu yang lebih lama duluan.
export function sortComments(list, mode, replyCount) {
  const arr = [...list];
  if (mode === "recent") {
    arr.sort((a, b) => time(b) - time(a));
  } else {
    arr.sort(
      (a, b) =>
        (b.likes || 0) - (a.likes || 0) ||
        replyCount(b.id) - replyCount(a.id) ||
        time(a) - time(b)
    );
  }
  return arr;
}

export function SortTabs() {
  const { sort, setSort } = useContext(SortContext);
  return (
    <div className="flex items-center gap-5 border-b border-gray-100">
      {OPTIONS.map((o) => {
        const active = sort === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setSort(o.key)}
            className={`pb-2 -mb-px text-sm font-semibold bg-transparent border-0 border-b-2 cursor-pointer ${
              active
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}