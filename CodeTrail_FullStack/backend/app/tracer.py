import ast
import operator
from copy import deepcopy

class TraceError(Exception):
    pass

BINOPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod, ast.Pow: operator.pow,
}
CMPOPS = {
    ast.Eq: operator.eq, ast.NotEq: operator.ne, ast.Lt: operator.lt,
    ast.LtE: operator.le, ast.Gt: operator.gt, ast.GtE: operator.ge,
}

class Tracer:
    def __init__(self, source):
        if len(source) > 8000:
            raise TraceError("Code is too long. Keep the example under 8,000 characters.")
        try:
            self.tree = ast.parse(source)
        except SyntaxError:
            raise
        self.steps = []
        self.output = []
        self.env = {}
        self.source_lines = source.splitlines()
        self.max_steps = 250

    def add_step(self, node, message, kind="execute"):
        if len(self.steps) >= self.max_steps:
            raise TraceError("This example creates too many steps. Try a smaller loop.")
        line = getattr(node, "lineno", 1)
        self.steps.append({
            "index": len(self.steps),
            "line": line,
            "source": self.source_lines[line - 1].strip() if 0 < line <= len(self.source_lines) else "",
            "message": message,
            "kind": kind,
            "variables": deepcopy(self.env),
            "output": "\n".join(self.output),
        })

    def expr(self, node):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float, str, bool)) or node.value is None:
                return node.value
            raise TraceError("Only simple numbers, strings, booleans, and None are supported.")
        if isinstance(node, ast.Name):
            if node.id not in self.env:
                raise TraceError(f"NameError: '{node.id}' has not been defined yet.")
            return self.env[node.id]
        if isinstance(node, ast.List):
            return [self.expr(x) for x in node.elts]
        if isinstance(node, ast.Tuple):
            return tuple(self.expr(x) for x in node.elts)
        if isinstance(node, ast.BinOp) and type(node.op) in BINOPS:
            left, right = self.expr(node.left), self.expr(node.right)
            try:
                value = BINOPS[type(node.op)](left, right)
                if isinstance(value, (int, float, str)) and len(str(value)) > 1000:
                    raise TraceError("Result is too large for this visualizer.")
                return value
            except ZeroDivisionError:
                raise TraceError("ZeroDivisionError: you tried to divide by zero.")
            except (TypeError, ValueError, OverflowError) as exc:
                raise TraceError(f"TypeError: these values cannot be combined this way ({exc}).")
        if isinstance(node, ast.UnaryOp):
            val = self.expr(node.operand)
            if isinstance(node.op, ast.USub): return -val
            if isinstance(node.op, ast.UAdd): return +val
            if isinstance(node.op, ast.Not): return not val
        if isinstance(node, ast.Compare) and len(node.ops) == 1 and type(node.ops[0]) in CMPOPS:
            return CMPOPS[type(node.ops[0])](self.expr(node.left), self.expr(node.comparators[0]))
        if isinstance(node, ast.Subscript):
            value = self.expr(node.value)
            index = self.expr(node.slice)
            try:
                return value[index]
            except IndexError:
                raise TraceError("IndexError: this index is outside the available list positions.")
            except (TypeError, KeyError):
                raise TraceError("TypeError: this value cannot be accessed with that index.")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "range":
            args = [self.expr(a) for a in node.args]
            if not 1 <= len(args) <= 3 or not all(isinstance(a, int) for a in args):
                raise TraceError("Use range() with one, two, or three integer arguments.")
            values = list(range(*args))
            if len(values) > 100:
                raise TraceError("Keep range() to 100 iterations or fewer.")
            return values
        raise TraceError(f"Unsupported expression: {type(node).__name__}. Try variables, arithmetic, lists, comparisons, or range().")

    def target_name(self, target):
        if isinstance(target, ast.Name):
            return target.id
        raise TraceError("This version supports assigning values to one variable at a time.")

    def run_statements(self, statements, depth=0):
        if depth > 10:
            raise TraceError("Nested loops/conditions are too deep for this demo.")
        for node in statements:
            if isinstance(node, ast.Assign):
                if len(node.targets) != 1:
                    raise TraceError("Use one assignment target per line.")
                name = self.target_name(node.targets[0])
                self.env[name] = self.expr(node.value)
                self.add_step(node, f"Stored {name} = {self.env[name]!r}")
            elif isinstance(node, ast.AnnAssign) and node.value is not None:
                name = self.target_name(node.target)
                self.env[name] = self.expr(node.value)
                self.add_step(node, f"Stored {name} = {self.env[name]!r}")
            elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name) and node.value.func.id == "print":
                values = [self.expr(a) for a in node.value.args]
                text = " ".join(str(v) for v in values)
                self.output.append(text)
                self.add_step(node, f"Printed {text!r}", "output")
            elif isinstance(node, ast.For):
                if not isinstance(node.target, ast.Name):
                    raise TraceError("Use a simple variable in the for-loop.")
                iterable = self.expr(node.iter)
                if not isinstance(iterable, (list, tuple, range)):
                    raise TraceError("This for-loop needs a list, tuple, or range().")
                for val in iterable:
                    self.env[node.target.id] = val
                    self.add_step(node, f"Loop iteration: {node.target.id} = {val!r}", "loop")
                    self.run_statements(node.body, depth + 1)
                if node.orelse:
                    self.run_statements(node.orelse, depth + 1)
            elif isinstance(node, ast.If):
                result = self.expr(node.test)
                self.add_step(node, f"Condition evaluated to {result}", "condition")
                self.run_statements(node.body if result else node.orelse, depth + 1)
            elif isinstance(node, ast.Pass):
                self.add_step(node, "Skipped pass statement")
            else:
                raise TraceError(f"Unsupported statement: {type(node).__name__}. This learning MVP supports assignments, print(), for/range loops, and if statements.")

def trace_code(source):
    tracer = Tracer(source)
    tracer.run_statements(tracer.tree.body)
    if not tracer.steps:
        tracer.add_step(ast.parse("pass").body[0], "No executable statements found.")
    return {
        "ok": True,
        "steps": tracer.steps,
        "output": "\n".join(tracer.output),
        "summary": f"Created {len(tracer.steps)} visualization step(s).",
        "supported": ["assignments", "arithmetic", "print()", "for/range loops", "if comparisons", "simple lists and indexing"],
    }
