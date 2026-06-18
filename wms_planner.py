"""
WMS Planner - SAP Business One + Produmex WMS release planning tool.

A single-file Python 3 desktop application using Tkinter, CSV persistence,
and Matplotlib charts. It helps warehouse supervisors decide how many sales
order lines should be released to preparation based on backlog, WMS workload,
and historical trend indicators.
"""

from __future__ import annotations

import csv
import shutil
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from tkinter import BOTH, END, LEFT, RIGHT, VERTICAL, X, Y, filedialog, messagebox, ttk
import tkinter as tk

from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure


# ----------------------------- Business constants -----------------------------

CAPACITY_LINES_PER_DAY = 210
HISTORY_FILE = Path("historico_wms.csv")
CSV_COLUMNS = [
    "DateTime",
    "Backlog",
    "Preparation",
    "Packing",
    "Assigned",
    "Objective",
    "Remaining",
    "DaysBacklog",
    "DailyVariation",
    "WeeklyVariation",
    "Status",
]

STATUS_OBJECTIVES = {
    "LOW": 100,
    "NORMAL": 120,
    "HIGH": 130,
    "CRITICAL": 150,
}


DARK_BG = "#0f172a"
PANEL_BG = "#172033"
CARD_BG = "#1e293b"
TEXT = "#e5e7eb"
MUTED = "#94a3b8"
ACCENT = "#38bdf8"
GRID = "#334155"


@dataclass
class WMSResult:
    """Calculated planning result ready to persist and display."""

    timestamp: datetime
    backlog: int
    preparation: int
    packing: int
    assigned: int
    objective: int
    remaining: int
    days_backlog: float
    daily_variation: int
    weekly_variation: int
    status: str
    traffic_light: str
    recommendations: list[str]


# ----------------------------- CSV and calculations ----------------------------


def read_history() -> list[dict[str, str]]:
    """Read CSV history, returning an empty list if the file does not exist yet."""
    if not HISTORY_FILE.exists():
        return []
    with HISTORY_FILE.open("r", newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def append_history(result: WMSResult) -> None:
    """Append one planning execution to historico_wms.csv."""
    file_exists = HISTORY_FILE.exists()
    with HISTORY_FILE.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_COLUMNS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(
            {
                "DateTime": result.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "Backlog": result.backlog,
                "Preparation": result.preparation,
                "Packing": result.packing,
                "Assigned": result.assigned,
                "Objective": result.objective,
                "Remaining": result.remaining,
                "DaysBacklog": f"{result.days_backlog:.2f}",
                "DailyVariation": result.daily_variation,
                "WeeklyVariation": result.weekly_variation,
                "Status": result.status,
            }
        )


def parse_datetime(value: str) -> datetime | None:
    """Parse a history timestamp without failing the whole application."""
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except (TypeError, ValueError):
            continue
    return None


def safe_int(value: str, default: int = 0) -> int:
    """Convert CSV or GUI values to int safely."""
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def get_status(days_backlog: float) -> str:
    """Classify backlog days against the operational target."""
    if days_backlog < 3:
        return "LOW"
    if days_backlog <= 5:
        return "NORMAL"
    if days_backlog <= 7:
        return "HIGH"
    return "CRITICAL"


def find_backlog_7_days_ago(history: list[dict[str, str]], now: datetime) -> int | None:
    """Find the latest backlog value recorded at least seven days before now."""
    cutoff = now - timedelta(days=7)
    candidates: list[tuple[datetime, int]] = []
    for row in history:
        row_time = parse_datetime(row.get("DateTime", ""))
        if row_time and row_time <= cutoff:
            candidates.append((row_time, safe_int(row.get("Backlog", "0"))))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0])
    return candidates[-1][1]


def calculate_plan(backlog: int, preparation: int, packing: int, assigned: int) -> WMSResult:
    """Apply all WMS Planner business rules and return the final result."""
    history = read_history()
    now = datetime.now()
    days_backlog = backlog / CAPACITY_LINES_PER_DAY
    status = get_status(days_backlog)

    last_backlog = safe_int(history[-1].get("Backlog", "0"), backlog) if history else backlog
    backlog_7_days_ago = find_backlog_7_days_ago(history, now)
    daily_variation = backlog - last_backlog
    weekly_variation = backlog - backlog_7_days_ago if backlog_7_days_ago is not None else daily_variation

    objective = STATUS_OBJECTIVES[status]

    # Trend adjustment: strongest threshold wins, as specified by >70, >140, >210.
    if weekly_variation > 210:
        objective += 30
    elif weekly_variation > 140:
        objective += 20
    elif weekly_variation > 70:
        objective += 10

    # WMS workload adjustments: strongest threshold wins for each area.
    if preparation > 150:
        objective -= 40
    elif preparation > 120:
        objective -= 20

    if packing > 120:
        objective -= 30
    elif packing > 90:
        objective -= 10

    objective = max(100, min(180, objective))
    remaining = max(0, objective - assigned)

    traffic_light = get_traffic_light(preparation, packing)
    recommendations = build_recommendations(daily_variation, weekly_variation, preparation, packing, traffic_light)

    return WMSResult(
        timestamp=now,
        backlog=backlog,
        preparation=preparation,
        packing=packing,
        assigned=assigned,
        objective=objective,
        remaining=remaining,
        days_backlog=days_backlog,
        daily_variation=daily_variation,
        weekly_variation=weekly_variation,
        status=status,
        traffic_light=traffic_light,
        recommendations=recommendations,
    )


def get_traffic_light(preparation: int, packing: int) -> str:
    """Return Green, Yellow, or Red based on preparation and packing queues."""
    if preparation > 120 or packing > 100:
        return "Red"
    if 100 <= preparation <= 120 or 80 <= packing <= 100:
        return "Yellow"
    return "Green"


def build_recommendations(
    daily_variation: int,
    weekly_variation: int,
    preparation: int,
    packing: int,
    traffic_light: str,
) -> list[str]:
    """Generate concise operational recommendations for supervisors."""
    recommendations: list[str] = []
    if traffic_light == "Green":
        recommendations.append("Continue assigning")
    if daily_variation > 0 or weekly_variation > 70:
        recommendations.append("Backlog increasing")
    if preparation > 120:
        recommendations.append("Reduce assignments")
    if packing > 100:
        recommendations.append("Packing overloaded")
    if not recommendations:
        recommendations.append("Continue assigning")
    return recommendations


# ----------------------------------- GUI -----------------------------------


class WMSPlannerApp(tk.Tk):
    """Main Tkinter application window."""

    def __init__(self) -> None:
        super().__init__()
        self.title("WMS Planner")
        self.geometry("1320x860")
        self.minsize(1050, 720)
        self.configure(bg=DARK_BG)
        self.current_result: WMSResult | None = None
        self.card_vars: dict[str, tk.StringVar] = {}
        self.inputs: dict[str, tk.StringVar] = {}
        self.chart_canvas: FigureCanvasTkAgg | None = None

        self.configure_styles()
        self.build_layout()
        self.refresh_charts()

    def configure_styles(self) -> None:
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TFrame", background=DARK_BG)
        style.configure("Panel.TFrame", background=PANEL_BG)
        style.configure("TLabel", background=DARK_BG, foreground=TEXT, font=("Segoe UI", 12))
        style.configure("Title.TLabel", background=DARK_BG, foreground=TEXT, font=("Segoe UI", 28, "bold"))
        style.configure("Muted.TLabel", background=DARK_BG, foreground=MUTED, font=("Segoe UI", 11))
        style.configure("TButton", font=("Segoe UI", 12, "bold"), padding=10)
        style.configure("TEntry", fieldbackground="#0b1220", foreground=TEXT, insertcolor=TEXT, font=("Segoe UI", 14))
        style.configure("Treeview", background=CARD_BG, foreground=TEXT, fieldbackground=CARD_BG, rowheight=28)
        style.configure("Treeview.Heading", background=PANEL_BG, foreground=TEXT, font=("Segoe UI", 10, "bold"))

    def build_layout(self) -> None:
        header = ttk.Frame(self)
        header.pack(fill=X, padx=22, pady=(18, 8))
        ttk.Label(header, text="WMS Planner", style="Title.TLabel").pack(side=LEFT)
        ttk.Label(
            header,
            text="SAP Business One + Produmex WMS release planning dashboard",
            style="Muted.TLabel",
        ).pack(side=LEFT, padx=18, pady=(14, 0))

        self.build_cards()

        main = ttk.Frame(self)
        main.pack(fill=BOTH, expand=True, padx=22, pady=12)
        left = ttk.Frame(main, style="Panel.TFrame")
        left.pack(side=LEFT, fill=Y, padx=(0, 14))
        right = ttk.Frame(main, style="Panel.TFrame")
        right.pack(side=RIGHT, fill=BOTH, expand=True)

        self.build_inputs(left)
        self.build_traffic_and_recommendations(left)
        self.chart_frame = right

    def build_cards(self) -> None:
        cards = ttk.Frame(self)
        cards.pack(fill=X, padx=22, pady=8)
        for label, initial in (
            ("Status", "--"),
            ("Backlog", "0"),
            ("Days Backlog", "0.00"),
            ("Objective", "0"),
            ("Remaining", "0"),
        ):
            frame = tk.Frame(cards, bg=CARD_BG, padx=18, pady=14, highlightthickness=1, highlightbackground=GRID)
            frame.pack(side=LEFT, fill=X, expand=True, padx=6)
            tk.Label(frame, text=label.upper(), bg=CARD_BG, fg=MUTED, font=("Segoe UI", 10, "bold")).pack(anchor="w")
            var = tk.StringVar(value=initial)
            self.card_vars[label] = var
            tk.Label(frame, textvariable=var, bg=CARD_BG, fg=TEXT, font=("Segoe UI", 26, "bold")).pack(anchor="w", pady=(5, 0))

    def build_inputs(self, parent: ttk.Frame) -> None:
        form = tk.Frame(parent, bg=PANEL_BG, padx=18, pady=18)
        form.pack(fill=X)
        tk.Label(form, text="Today Inputs", bg=PANEL_BG, fg=TEXT, font=("Segoe UI", 18, "bold")).pack(anchor="w", pady=(0, 12))
        fields = (
            ("backlog", "Backlog with stock today"),
            ("preparation", "Preparation lines currently open"),
            ("packing", "Packing lines currently open"),
            ("assigned", "Lines assigned today"),
        )
        for key, label in fields:
            tk.Label(form, text=label, bg=PANEL_BG, fg=MUTED, font=("Segoe UI", 11)).pack(anchor="w", pady=(9, 3))
            var = tk.StringVar(value="0")
            self.inputs[key] = var
            entry = ttk.Entry(form, textvariable=var, width=26)
            entry.pack(fill=X)

        for text, command in (
            ("CALCULATE", self.on_calculate),
            ("SHOW HISTORY", self.show_history),
            ("EXPORT CSV", self.export_csv),
            ("CLEAR TODAY INPUTS", self.clear_inputs),
        ):
            ttk.Button(form, text=text, command=command).pack(fill=X, pady=(14 if text == "CALCULATE" else 8, 0))

    def build_traffic_and_recommendations(self, parent: ttk.Frame) -> None:
        panel = tk.Frame(parent, bg=PANEL_BG, padx=18, pady=18)
        panel.pack(fill=BOTH, expand=True, pady=(14, 0))
        tk.Label(panel, text="Traffic Light", bg=PANEL_BG, fg=TEXT, font=("Segoe UI", 18, "bold")).pack(anchor="w")
        self.traffic_canvas = tk.Canvas(panel, width=110, height=110, bg=PANEL_BG, highlightthickness=0)
        self.traffic_canvas.pack(anchor="center", pady=10)
        self.traffic_text = tk.StringVar(value="Waiting for calculation")
        tk.Label(panel, textvariable=self.traffic_text, bg=PANEL_BG, fg=TEXT, font=("Segoe UI", 16, "bold")).pack()

        tk.Label(panel, text="Recommendations", bg=PANEL_BG, fg=TEXT, font=("Segoe UI", 18, "bold")).pack(anchor="w", pady=(24, 8))
        self.recommendations = tk.Text(panel, height=8, bg="#0b1220", fg=TEXT, insertbackground=TEXT, relief="flat", font=("Segoe UI", 13), wrap="word")
        self.recommendations.pack(fill=BOTH, expand=True)
        self.update_traffic("Gray")

    def get_input_values(self) -> tuple[int, int, int, int] | None:
        try:
            values = tuple(int(self.inputs[key].get()) for key in ("backlog", "preparation", "packing", "assigned"))
        except ValueError:
            messagebox.showerror("Invalid input", "All inputs must be whole numbers.")
            return None
        if any(value < 0 for value in values):
            messagebox.showerror("Invalid input", "Inputs cannot be negative.")
            return None
        return values

    def on_calculate(self) -> None:
        values = self.get_input_values()
        if values is None:
            return
        result = calculate_plan(*values)
        append_history(result)
        self.current_result = result
        self.update_dashboard(result)
        self.refresh_charts()
        messagebox.showinfo("Saved", f"Calculation saved automatically in {HISTORY_FILE}.")

    def update_dashboard(self, result: WMSResult) -> None:
        self.card_vars["Status"].set(result.status)
        self.card_vars["Backlog"].set(str(result.backlog))
        self.card_vars["Days Backlog"].set(f"{result.days_backlog:.2f}")
        self.card_vars["Objective"].set(str(result.objective))
        self.card_vars["Remaining"].set(str(result.remaining))
        self.update_traffic(result.traffic_light)
        self.traffic_text.set(result.traffic_light.upper())
        self.recommendations.delete("1.0", END)
        for item in result.recommendations:
            self.recommendations.insert(END, f"• {item}\n")
        self.recommendations.insert(END, f"\nDaily variation: {result.daily_variation:+d} lines")
        self.recommendations.insert(END, f"\nWeekly variation: {result.weekly_variation:+d} lines")

    def update_traffic(self, traffic: str) -> None:
        colors = {"Green": "#22c55e", "Yellow": "#eab308", "Red": "#ef4444", "Gray": "#64748b"}
        self.traffic_canvas.delete("all")
        self.traffic_canvas.create_oval(12, 12, 98, 98, fill=colors.get(traffic, colors["Gray"]), outline="#e5e7eb", width=3)

    def refresh_charts(self) -> None:
        rows = read_history()
        if self.chart_canvas:
            self.chart_canvas.get_tk_widget().destroy()

        fig = Figure(figsize=(9, 7), facecolor=PANEL_BG)
        axes = [fig.add_subplot(2, 2, index) for index in range(1, 5)]
        for ax in axes:
            ax.set_facecolor("#0b1220")
            ax.tick_params(colors=MUTED, labelsize=8)
            ax.grid(True, color=GRID, linewidth=0.5)
            for spine in ax.spines.values():
                spine.set_color(GRID)

        dates = [parse_datetime(row.get("DateTime", "")) or datetime.now() for row in rows]
        labels = [dt.strftime("%m-%d\n%H:%M") for dt in dates]
        backlog = [safe_int(row.get("Backlog")) for row in rows]
        weekly = [safe_int(row.get("WeeklyVariation")) for row in rows]
        preparation = [safe_int(row.get("Preparation")) for row in rows]
        packing = [safe_int(row.get("Packing")) for row in rows]
        objective = [safe_int(row.get("Objective")) for row in rows]

        self.plot_line(axes[0], labels, backlog, "Backlog history", ACCENT)
        self.plot_line(axes[1], labels, weekly, "Weekly trend", "#f59e0b")
        self.plot_line(axes[2], labels, preparation, "Preparation", "#a78bfa")
        axes[2].plot(labels, packing, marker="o", color="#fb7185", label="Packing")
        axes[2].legend(facecolor=PANEL_BG, edgecolor=GRID, labelcolor=TEXT)
        self.plot_line(axes[3], labels, objective, "Objective history", "#22c55e")

        fig.tight_layout(pad=2.0)
        self.chart_canvas = FigureCanvasTkAgg(fig, master=self.chart_frame)
        self.chart_canvas.draw()
        self.chart_canvas.get_tk_widget().pack(fill=BOTH, expand=True, padx=16, pady=16)

    def plot_line(self, ax, labels: list[str], values: list[int], title: str, color: str) -> None:
        ax.set_title(title, color=TEXT, fontsize=12, fontweight="bold")
        if values:
            ax.plot(labels, values, marker="o", color=color, linewidth=2)
        else:
            ax.text(0.5, 0.5, "No history yet", color=MUTED, ha="center", va="center", transform=ax.transAxes)
        ax.tick_params(axis="x", rotation=45)

    def show_history(self) -> None:
        rows = read_history()
        window = tk.Toplevel(self)
        window.title("WMS Planner History")
        window.geometry("1180x520")
        window.configure(bg=DARK_BG)
        frame = ttk.Frame(window)
        frame.pack(fill=BOTH, expand=True, padx=14, pady=14)
        scrollbar = ttk.Scrollbar(frame, orient=VERTICAL)
        tree = ttk.Treeview(frame, columns=CSV_COLUMNS, show="headings", yscrollcommand=scrollbar.set)
        scrollbar.config(command=tree.yview)
        scrollbar.pack(side=RIGHT, fill=Y)
        tree.pack(side=LEFT, fill=BOTH, expand=True)
        for column in CSV_COLUMNS:
            tree.heading(column, text=column)
            tree.column(column, width=110, anchor="center")
        for row in rows:
            tree.insert("", END, values=[row.get(column, "") for column in CSV_COLUMNS])

    def export_csv(self) -> None:
        if not HISTORY_FILE.exists():
            messagebox.showwarning("No history", "No CSV history exists yet. Run CALCULATE first.")
            return
        destination = filedialog.asksaveasfilename(
            title="Export WMS Planner history",
            defaultextension=".csv",
            initialfile="historico_wms_export.csv",
            filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
        )
        if destination:
            shutil.copyfile(HISTORY_FILE, destination)
            messagebox.showinfo("Export complete", f"History exported to:\n{destination}")

    def clear_inputs(self) -> None:
        for var in self.inputs.values():
            var.set("0")


if __name__ == "__main__":
    app = WMSPlannerApp()
    app.mainloop()
