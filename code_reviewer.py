#!/usr/bin/env python3
"""Intelligent code reviewer.

Static analysis tool for Python source files. It reports:
  - syntax errors
  - logic errors
  - repeated code
  - organization problems
  - missing validations
  - possible improvements

Usage:
    python code_reviewer.py file1.py [file2.py ...] [--json]

Exit codes: 0 = clean, 1 = findings reported, 2 = input error.
"""

from __future__ import annotations

import argparse
import ast
import io
import json
import re
import sys
import tokenize
from collections import defaultdict
from dataclasses import asdict, dataclass

CATEGORIES = (
    "syntax",
    "logic",
    "duplication",
    "organization",
    "validation",
    "improvement",
)
SEVERITY_WEIGHT = {"error": 12, "warning": 5, "info": 1}
ERROR_KEYWORDS = (
    "cannot",
    "must",
    "invalid",
    "error",
    "failed",
    "empty",
    "not allowed",
    "negative",
    "exceed",
)
TRIVIAL_LINES = {"pass", "return", "break", "continue", "...", "}", ")", "]"}
MIN_DUP_LINES = 3
MAX_DUP_LINES = 8
LONG_FUNCTION_LINES = 40


@dataclass
class Issue:
    file: str
    line: int
    category: str
    severity: str
    message: str
    suggestion: str = ""


def normalize_line(line: str) -> str:
    line = line.split("#", 1)[0] if not _has_quoted_hash(line) else line
    return re.sub(r"\s+", " ", line.strip())


def _has_quoted_hash(line: str) -> bool:
    return bool(re.search(r"[\"'].*#.*[\"']", line))


def find_duplicate_blocks(source: str, filename: str) -> list[Issue]:
    lines = source.splitlines()
    norm = [normalize_line(line) for line in lines]
    issues: list[Issue] = []
    covered: set[int] = set()

    def substantive(text: str) -> bool:
        return len(text) >= 4 and text not in TRIVIAL_LINES

    for width in range(MAX_DUP_LINES, MIN_DUP_LINES - 1, -1):
        groups: dict[tuple, list[int]] = defaultdict(list)
        for start in range(len(norm) - width + 1):
            block = norm[start : start + width]
            if not all(substantive(text) for text in block):
                continue
            groups[tuple(block)].append(start)

        for starts in groups.values():
            if len(starts) < 2:
                continue
            fresh = [s for s in starts if not any(n in covered for n in range(s, s + width))]
            if not fresh:
                continue
            reference = starts[0]
            reported = fresh if reference in fresh else fresh
            locations = ", ".join(str(s + 1) for s in reported)
            ref_end = reference + width
            issues.append(
                Issue(
                    filename,
                    reported[0] + 1,
                    "duplication",
                    "warning",
                    f"Repeated code block ({width} lines) at lines {locations}, "
                    f"same as lines {reference + 1}-{ref_end}",
                    "Extract the shared block into a single function and call it from each place",
                )
            )
            for start in starts:
                covered.update(range(start, start + width))
    return issues


def regex_fallback(source: str, filename: str) -> list[Issue]:
    issues = find_duplicate_blocks(source, filename)
    for number, line in enumerate(source.splitlines(), start=1):
        text = normalize_line(line)
        if not text:
            continue
        if re.search(r"==\s*None|!=\s*None", text):
            issues.append(Issue(filename, number, "logic", "warning",
                                "Comparison with None using '==' / '!='",
                                "Use 'is' or 'is not' instead"))
        if re.search(r"while\s+1\s*:", text):
            issues.append(Issue(filename, number, "improvement", "info",
                                "Loop written as 'while 1'", "Use 'while True'"))
        if re.search(r"except\s*:", text):
            issues.append(Issue(filename, number, "organization", "warning",
                                "Bare 'except:' catches every exception",
                                "Catch specific exceptions such as 'except ValueError:'"))
        if "= input(" in text and not any(
            token in text for token in ("int(", "float(", ".strip(", ".strip()")
        ):
            issues.append(Issue(filename, number, "validation", "warning",
                                "input() result stored without validation or conversion",
                                "Convert and validate the value before using it"))
        if re.search(r'"[^"]*"\s*%\s|\'[^\']*\'\s*%\s', text):
            issues.append(Issue(filename, number, "improvement", "info",
                                "Old '%' string formatting", "Use an f-string instead"))
    return issues


class AstReviewer:
    def __init__(self, source: str, filename: str, tree: ast.Module):
        self.source = source
        self.file = filename
        self.tree = tree
        self.issues: list[Issue] = []
        self.load_names: set[str] = {
            node.id for node in ast.walk(tree) if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load)
        }
        for node in ast.walk(tree):
            for field, value in ast.iter_fields(node):
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, ast.AST):
                            setattr(item, "_parent", node)
                elif isinstance(value, ast.AST):
                    setattr(value, "_parent", node)

    def add(self, line: int, category: str, severity: str, message: str, suggestion: str = "") -> None:
        self.issues.append(Issue(self.file, line, category, severity, message, suggestion))

    def review(self) -> list[Issue]:
        self.check_duplicates()
        self.check_logic()
        self.check_validations()
        self.check_organization()
        self.check_bare_except()
        self.check_improvements()
        self.issues.sort(key=lambda issue: (issue.line, issue.category))
        return self.issues

    def check_duplicates(self) -> None:
        self.issues.extend(find_duplicate_blocks(self.source, self.file))

    def check_logic(self) -> None:
        for node in ast.walk(self.tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for default in list(node.args.defaults) + [d for d in node.args.kw_defaults if d]:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        self.add(default.lineno, "logic", "warning",
                                 f"Function '{node.name}' uses a mutable default argument",
                                 "Use None as the default and create the collection inside the function")
            if isinstance(node, ast.Compare):
                self.check_none_comparison(node)
            if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Div, ast.FloorDiv)):
                self.check_division(node)
            if isinstance(node, ast.AugAssign) and isinstance(node.op, (ast.Div, ast.FloorDiv)):
                self.check_division(node)
            if isinstance(node, ast.BoolOp) and isinstance(node.op, ast.And):
                self.check_impossible_condition(node)
            if isinstance(node, ast.For):
                self.check_for_iter(node)

    def check_none_comparison(self, node: ast.Compare) -> None:
        for op, comparator in zip(node.ops, node.comparators):
            if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(comparator, ast.Constant) and comparator.value is None:
                self.add(node.lineno, "logic", "warning",
                         "Comparison with None using '==' / '!='",
                         "Use 'is' or 'is not' instead")

    def check_division(self, node) -> None:
        divisor = node.right if isinstance(node, ast.BinOp) else node.value
        line = node.lineno
        if isinstance(divisor, ast.Constant):
            if divisor.value == 0:
                self.add(line, "logic", "error", "Division by the literal zero",
                         "Guard the division before using it")
            return
        base = self.base_name(divisor)
        if base is None:
            return
        if self.has_zero_guard(base, self.enclosing_function(node)):
            return
        self.add(line, "logic", "warning",
                 f"Division by '{ast.unparse(divisor)}' without checking '{base}' for zero",
                 f"Add a check such as 'if {base} == 0:' before dividing")

    @staticmethod
    def enclosing_function(node: ast.AST) -> ast.AST | None:
        scope = node
        while scope is not None and not isinstance(scope, (ast.FunctionDef, ast.AsyncFunctionDef)):
            scope = getattr(scope, "_parent", None)
        return scope

    def base_name(self, node: ast.AST) -> str | None:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "len":
            if node.args and isinstance(node.args[0], ast.Name):
                return node.args[0].id
        return None

    def has_zero_guard(self, name: str, scope: ast.AST | None) -> bool:
        if scope is None:
            return False
        for node in ast.walk(scope):
            if isinstance(node, ast.Try):
                return True
            if isinstance(node, ast.Compare) and any(
                isinstance(left, ast.Name) and left.id == name for left in ast.walk(node)
            ):
                return True
            if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
                if isinstance(node.operand, ast.Name) and node.operand.id == name:
                    return True
        return False

    def check_impossible_condition(self, node: ast.BoolOp) -> None:
        low_ops = (ast.Lt, ast.LtE)
        high_ops = (ast.Gt, ast.GtE)
        pairs = [c for c in node.values if isinstance(c, ast.Compare) and len(c.ops) == 1
                 and isinstance(c.left, ast.Name)
                 and isinstance(c.comparators[0], ast.Constant)
                 and isinstance(c.comparators[0].value, (int, float))]
        for i, first in enumerate(pairs):
            for second in pairs[i + 1:]:
                if first.left.id != second.left.id:
                    continue
                op1, op2 = first.ops[0], second.ops[0]
                val1, val2 = first.comparators[0].value, second.comparators[0].value
                cases = [
                    (isinstance(op1, low_ops) and isinstance(op2, high_ops) and val1 < val2),
                    (isinstance(op2, low_ops) and isinstance(op1, high_ops) and val2 < val1),
                ]
                if any(cases):
                    name = first.left.id
                    self.add(node.lineno, "logic", "error",
                             f"Condition is always False: '{name}' cannot satisfy both "
                             f"'{ast.unparse(first)}' and '{ast.unparse(second)}'",
                             "The bounds contradict each other, probably 'and' should be 'or'")
                    return

    def check_for_iter(self, node: ast.For) -> None:
        call = node.iter
        if (isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "range"
                and len(call.args) == 2 and isinstance(call.args[0], ast.Constant) and call.args[0].value == 1
                and isinstance(call.args[1], ast.Call) and isinstance(call.args[1].func, ast.Name)
                and call.args[1].func.id == "len"):
            self.add(node.lineno, "logic", "warning",
                     "Loop starts at index 1, so the first element is skipped (off-by-one)",
                     "Start the range at 0 or iterate directly over the collection")

    def check_validations(self) -> None:
        parent_if: set[int] = set()
        for node in ast.walk(self.tree):
            if isinstance(node, ast.If):
                for child in node.orelse:
                    if isinstance(child, ast.If):
                        parent_if.add(id(child))
        inside_try: set[int] = set()
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Try):
                for child in ast.walk(node):
                    inside_try.add(id(child))

        bare_inputs: list[int] = []
        unguarded_conversions: list[int] = []
        for node in ast.walk(self.tree):
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
                func = node.value.func
                if isinstance(func, ast.Name) and func.id == "input":
                    bare_inputs.append(node.lineno)
                if (isinstance(func, ast.Name) and func.id in ("int", "float")
                        and node.value.args and not isinstance(node.value.args[0], ast.Constant)
                        and id(node) not in inside_try):
                    unguarded_conversions.append(node.lineno)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in ("int", "float"):
                if node.args and not isinstance(node.args[0], ast.Constant) and id(node) not in inside_try:
                    unguarded_conversions.append(node.lineno)
            if isinstance(node, ast.If) and id(node) not in parent_if:
                self.check_print_and_continue(node)

        for line in sorted(set(bare_inputs)):
            self.add(line, "validation", "warning",
                     "input() result stored without validation or type conversion",
                     "Convert the value (int/float/strip) and reject invalid input before using it")
        if unguarded_conversions:
            line = min(unguarded_conversions)
            self.add(line, "validation", "warning",
                     "Numeric conversion (int/float) with no exception handling in the file",
                     "Wrap conversions in try/except ValueError and ask the user again")

    def check_print_and_continue(self, node: ast.If) -> None:
        body = node.body
        if len(body) != 1 or not isinstance(body[0], ast.Expr):
            return
        call = body[0].value
        if not (isinstance(call, ast.Call) and isinstance(call.func, ast.Name) and call.func.id == "print"):
            return
        if not call.args or not isinstance(call.args[0], ast.Constant) or not isinstance(call.args[0].value, str):
            return
        message = call.args[0].value.lower()
        if not any(keyword in message for keyword in ERROR_KEYWORDS):
            return
        self.add(node.lineno, "validation", "warning",
                 f"Validation prints '{call.args[0].value}' but execution continues anyway",
                 "Return, raise or re-prompt after the error message so invalid data is rejected")

    def check_organization(self) -> None:
        has_main_guard = False
        for node in ast.walk(self.tree):
            if (isinstance(node, ast.If) and isinstance(node.test, ast.Compare)
                    and isinstance(node.test.left, ast.Name) and node.test.left.id == "__name__"):
                has_main_guard = True

        defined: dict[str, int] = {}
        for node in self.tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                defined[node.name] = node.lineno
                self.check_docstring(node)
                span = (node.end_lineno or node.lineno) - node.lineno
                if span > LONG_FUNCTION_LINES:
                    self.add(node.lineno, "organization", "warning",
                             f"Function '{node.name}' is {span} lines long",
                             "Split it into smaller functions with a single responsibility")
            if isinstance(node, (ast.Assign, ast.AnnAssign)):
                self.check_module_state(node)

        for name, line in defined.items():
            if name.startswith("_"):
                continue
            if name not in self.load_names:
                self.add(line, "organization", "warning",
                         f"Function '{name}' is defined but never used",
                         "Remove the dead code or call it from the program flow")

        module_calls = [
            node for node in self.tree.body
            if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
            and isinstance(node.value.func, ast.Name) and node.value.func.id in defined
        ]
        for call in module_calls:
            if not has_main_guard:
                self.add(call.lineno, "organization", "warning",
                         f"Program calls '{call.value.func.id}()' at import time",
                         "Wrap the entry point in \"if __name__ == '__main__':\"")
        if not has_main_guard:
            first = self.tree.body[0].lineno if self.tree.body else 1
            self.add(first, "organization", "warning",
                     "Missing \"if __name__ == '__main__':\" guard",
                     "Protect the entry point so the module can be imported safely")

    def check_bare_except(self) -> None:
        for node in ast.walk(self.tree):
            if isinstance(node, ast.ExceptHandler) and node.type is None:
                self.add(node.lineno, "organization", "warning",
                         "Bare 'except:' catches every exception",
                         "Catch specific exceptions such as 'except ValueError:'")

    def check_docstring(self, node: ast.FunctionDef) -> None:
        if not (node.body and isinstance(node.body[0], ast.Expr)
                and isinstance(node.body[0].value, ast.Constant)
                and isinstance(node.body[0].value.value, str)):
            self.add(node.lineno, "organization", "info",
                     f"Function '{node.name}' has no docstring",
                     "Add a docstring describing what the function does")

    def check_module_state(self, node) -> None:
        targets = []
        if isinstance(node, ast.Assign):
            targets = [t for t in node.targets if isinstance(t, ast.Name)]
            value = node.value
        else:
            if isinstance(node.target, ast.Name):
                targets = [node.target]
            value = node.value
        if isinstance(value, (ast.Dict, ast.List, ast.Set)):
            for target in targets:
                self.add(node.lineno, "organization", "warning",
                         f"Module-level mutable state '{target.id}' shared by all code",
                         "Pass the data into functions as a parameter instead of using a global")

    def check_improvements(self) -> None:
        reported_lines: set[int] = set()
        for node in ast.walk(self.tree):
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mod):
                if isinstance(node.left, ast.Constant) and isinstance(node.left.value, str):
                    if node.lineno not in reported_lines:
                        reported_lines.add(node.lineno)
                        self.add(node.lineno, "improvement", "info",
                                 "Old '%' string formatting",
                                 "Use an f-string instead")
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
                if any(isinstance(operand, ast.Call) and isinstance(operand.func, ast.Name)
                       and operand.func.id == "str" for operand in (node.left, node.right)):
                    if node.lineno not in reported_lines:
                        reported_lines.add(node.lineno)
                        self.add(node.lineno, "improvement", "info",
                                 "String built with '+' and str()",
                                 "Use an f-string instead")
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "format":
                self.add(node.lineno, "improvement", "info",
                         "String built with .format()",
                         "Use an f-string instead")
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "list":
                if (node.args and isinstance(node.args[0], ast.Attribute) and node.args[0].attr == "keys"):
                    self.add(node.lineno, "improvement", "info",
                             "list(dict.keys()) is verbose",
                             "Iterate with dict.items() or use list(dict) directly")
            if isinstance(node, ast.For) and isinstance(node.iter, ast.Call) \
                    and isinstance(node.iter.func, ast.Name) and node.iter.func.id == "range" \
                    and len(node.iter.args) == 1 and isinstance(node.iter.args[0], ast.Call) \
                    and isinstance(node.iter.args[0].func, ast.Name) and node.iter.args[0].func.id == "len":
                self.add(node.lineno, "improvement", "info",
                         "Loop uses range(len(...))",
                         "Use enumerate() to get the index and the value")
            if isinstance(node, ast.While) and isinstance(node.test, ast.Constant) \
                    and not isinstance(node.test.value, bool) and node.test.value == 1:
                self.add(node.lineno, "improvement", "info",
                         "Loop written as 'while 1'",
                         "Use 'while True'")
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mult) \
                    and isinstance(node.right, ast.Constant) and isinstance(node.right.value, float) \
                    and node.right.value not in (0.0, 1.0):
                self.add(node.lineno, "improvement", "info",
                         f"Magic number {node.right.value} embedded in the code",
                         "Extract it into a named constant")
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Mult) \
                    and isinstance(node.left, ast.Constant) and isinstance(node.left.value, float) \
                    and node.left.value not in (0.0, 1.0):
                self.add(node.lineno, "improvement", "info",
                         f"Magic number {node.left.value} embedded in the code",
                         "Extract it into a named constant")
        self.check_sum_accumulation()

    def check_sum_accumulation(self) -> None:
        for func in [n for n in ast.walk(self.tree) if isinstance(n, ast.FunctionDef)]:
            zero_names = set()
            for node in ast.walk(func):
                if isinstance(node, ast.Assign) and isinstance(node.value, ast.Constant) \
                        and node.value.value == 0:
                    zero_names.update(t.id for t in node.targets if isinstance(t, ast.Name))
            if not zero_names:
                continue
            for node in ast.walk(func):
                if not isinstance(node, (ast.For, ast.While)):
                    continue
                for child in ast.walk(node):
                    name = None
                    if isinstance(child, ast.AugAssign) and isinstance(child.op, ast.Add) \
                            and isinstance(child.target, ast.Name):
                        name = child.target.id
                    elif isinstance(child, ast.Assign) and isinstance(child.value, ast.BinOp) \
                            and isinstance(child.value.op, ast.Add) \
                            and isinstance(child.value.left, ast.Name) \
                            and len(child.targets) == 1 and isinstance(child.targets[0], ast.Name):
                        name = child.targets[0].id
                    if name in zero_names:
                        self.add(node.lineno, "improvement", "info",
                                 f"Manual accumulation into '{name}' inside a loop",
                                 "Use sum(...) with a generator expression instead")
                        zero_names.discard(name)


def read_source(filename: str) -> str:
    with tokenize.open(filename) as handle:
        return handle.read()


def analyze_file(filename: str) -> list[Issue]:
    try:
        source = read_source(filename)
    except OSError as exc:
        raise SystemExit(f"error: cannot read {filename}: {exc}")
    try:
        tree = ast.parse(source, filename=filename)
    except SyntaxError as exc:
        issues = [
            Issue(filename, exc.lineno or 0, "syntax", "error",
                  f"SyntaxError: {exc.msg}",
                  "Fix the syntax error; deeper analysis is blocked until the file parses")
        ]
        issues.extend(regex_fallback(source, filename))
        return issues
    return AstReviewer(source, filename, tree).review()


def grade(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    if score >= 60:
        return "C"
    if score >= 40:
        return "D"
    return "F"


def total_score(issues: list[Issue]) -> int:
    penalty = sum(SEVERITY_WEIGHT[issue.severity] for issue in issues)
    return max(0, 100 - penalty)


def print_report(filename: str, issues: list[Issue]) -> None:
    print("=" * 72)
    print(f" CODE REVIEW: {filename}")
    print("=" * 72)
    if not issues:
        print(" No issues found. The file looks clean.")
    for category in CATEGORIES:
        group = [issue for issue in issues if issue.category == category]
        if not group:
            continue
        print(f"\n [{category.upper()}]")
        for issue in group:
            tag = issue.severity.upper()
            print(f"   {tag:<7} line {issue.line:<4} {issue.message}")
            if issue.suggestion:
                print(f"           -> {issue.suggestion}")
    counts = {severity: sum(1 for i in issues if i.severity == severity)
              for severity in ("error", "warning", "info")}
    score = total_score(issues)
    print("\n" + "-" * 72)
    print(f" Summary: {counts['error']} errors, {counts['warning']} warnings, "
          f"{counts['info']} info | score {score}/100 (grade {grade(score)})")
    print("-" * 72)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Intelligent Python code reviewer")
    parser.add_argument("files", nargs="+", help="Python files to review")
    parser.add_argument("--json", action="store_true", help="Emit a JSON report")
    args = parser.parse_args(argv)

    reports = {}
    all_issues: list[Issue] = []
    for filename in args.files:
        issues = analyze_file(filename)
        reports[filename] = issues
        all_issues.extend(issues)
        if not args.json:
            print_report(filename, issues)

    if args.json:
        payload = {
            "files": [
                {
                    "file": name,
                    "score": total_score(items),
                    "issues": [asdict(issue) for issue in items],
                }
                for name, items in reports.items()
            ]
        }
        print(json.dumps(payload, indent=2))

    return 1 if all_issues else 0


if __name__ == "__main__":
    sys.exit(main())
