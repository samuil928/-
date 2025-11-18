// =======================
// ВСТАВКА ТЕКСТА ИЗ КНОПОК
// =======================
function insert(text) {
    const input = document.getElementById("expr");
    input.value += text;
    input.focus();
}


// =======================
// ПРЕОБРАЗОВАНИЕ ВВОДА
// =======================
function preprocess(expr) {
    expr = expr.trim();

    // π → pi
    expr = expr.replace(/π/g, "pi");

    // n√x -> (x)^(1/n)
    expr = expr.replace(/(\d+)\s*√\s*([0-9a-zA-Zπpi\[\]\(\)\.\+\-\*\/]+)/g,
        "($2)^(1/$1)");

    // √x -> sqrt(x)
    expr = expr.replace(/√\s*([0-9a-zA-Zπpi\[\]\(\)\.\+\-\*\/]+)/g,
        "sqrt($1)");

    return expr;
}


// =======================
// ОСНОВНАЯ ФУНКЦИЯ CALCULATE
// =======================
function calculate() {
    const input = document.getElementById("expr").value;
    const out = document.getElementById("result");

    if (!input.trim()) {
        out.innerText = "Введи выражение 😉";
        return;
    }

    try {
        let expr = preprocess(input);
        let result;


        // ----------------------
        // ПРОИЗВОДНАЯ (d/dx ...)
        // ----------------------
        if (expr.startsWith("d/dx")) {
            const body = expr.slice(4).trim();
            result = nerdamer(`diff(${body}, x)`).toString();
        }

        // ----------------------
        // ИНТЕГРАЛЫ
        // ----------------------
        else if (expr.startsWith("int") || expr.startsWith("∫")) {
            let inside = expr.replace(/^int|^∫/i, "").trim();

            if (inside.startsWith("(") && inside.endsWith(")")) {
                inside = inside.slice(1, -1).trim();
            }

            if (inside.includes(";")) {
                const parts = inside.split(";");
                if (parts.length !== 2) throw "Формат: int(0,5; x^2)";

                const boundsPart = parts[0].trim();
                const funcPart = parts[1].trim();

                const [aStr, bStr] = boundsPart.split(",");
                const a = aStr.trim();
                const b = bStr.trim();

                result = nerdamer(`defint(${funcPart}, x, ${a}, ${b})`).toString();
            } else {
                const func = inside.trim();
                result = nerdamer(`integrate(${func}, x)`).toString();
            }
        }


        // ----------------------
        // SIMPLIFY
        // ----------------------
        else if (expr.startsWith("simplify")) {
            let inside = expr.replace(/^simplify\s*/i, "").trim();
            if (inside.startsWith("(") && inside.endsWith(")")) {
                inside = inside.slice(1, -1);
            }
            result = nerdamer(inside).simplify().toString();
        }

        // ----------------------
        // EXPAND
        // ----------------------
        else if (expr.startsWith("expand")) {
            let inside = expr.replace(/^expand\s*/i, "").trim();
            if (inside.startsWith("(") && inside.endsWith(")")) {
                inside = inside.slice(1, -1);
            }
            result = nerdamer(inside).expand().toString();
        }

        // ----------------------
        // FACTOR
        // ----------------------
        else if (expr.startsWith("factor")) {
            let inside = expr.replace(/^factor\s*/i, "").trim();
            if (inside.startsWith("(") && inside.endsWith(")")) {
                inside = inside.slice(1, -1);
            }
            result = nerdamer(inside).factor().toString();
        }


        // ----------------------
        // МАТРИЦЫ — det, inv, rank, mul
        // ----------------------
        else if (expr.startsWith("det(")) {
            const inside = expr.slice(4, -1);
            const m = math.evaluate(inside);
            result = math.det(m).toString();
        }
        else if (expr.startsWith("inv(")) {
            const inside = expr.slice(4, -1);
            const m = math.evaluate(inside);
            result = math.format(math.inv(m), {precision: 14});
        }
        else if (expr.startsWith("rank(")) {
            const inside = expr.slice(5, -1);
            const m = math.evaluate(inside);
            result = math.rank(m).toString();
        }
        else if (expr.startsWith("mul(")) {
            let inside = expr.slice(4, -1);
            const parts = inside.split(",");
            if (parts.length < 2) throw "Формат: mul(A, B)";

            const A = math.evaluate(parts[0]);
            const B = math.evaluate(parts.slice(1).join(","));
            result = math.format(math.multiply(A, B), {precision: 14});
        }


        // ----------------------
        // УРАВНЕНИЯ — solve
        // ----------------------
        else if (expr.startsWith("solve")) {
            let inside = expr.replace(/^solve\s*/i, "").trim();
            if (inside.startsWith("(") && inside.endsWith(")")) {
                inside = inside.slice(1, -1);
            }

            if (inside.includes(";")) {
                const parts = inside.split(";");

                const vars = parts[parts.length - 1].trim().split(",").map(v => v.trim());
                const eqParts = parts.slice(0, -1);

                const eqs = eqParts.map(p => {
                    const s = p.trim();
                    if (s.includes("=")) {
                        const [l, r] = s.split("=");
                        return `${l}-(${r})`;
                    }
                    return s;
                });

                const sol = nerdamer.solveEquations(eqs, vars);
                result = JSON.stringify(sol);
            } else {
                let left, right;
                if (inside.includes("=")) {
                    [left, right] = inside.split("=");
                } else {
                    left = inside;
                    right = "0";
                }
                const eq = `${left}-(${right})`;
                result = nerdamer.solve(eq, "x").toString();
            }
        }


        // ----------------------
        // Обычные выражения
        // ----------------------
        else {
            try {
                result = nerdamer(expr).toString();
            } catch (e) {
                result = math.evaluate(expr).toString();
            }
        }


        out.innerText = "Результат: " + result;

    } catch (e) {
        out.innerText = "Ошибка: " + e;
    }
}
