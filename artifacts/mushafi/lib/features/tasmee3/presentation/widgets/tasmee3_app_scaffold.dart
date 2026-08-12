import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3AppScaffold extends StatelessWidget {
  final String title;
  final String? titleBadge;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final Widget? bottomNavigationBar;

  const Tasmee3AppScaffold({
    super.key,
    required this.title,
    this.titleBadge,
    required this.body,
    this.actions,
    this.floatingActionButton,
    this.bottomNavigationBar,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Tasmee3Colors.background,
        appBar: AppBar(
          title: titleBadge == null
              ? Text(title)
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(title),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Tasmee3Colors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        titleBadge!,
                        style: const TextStyle(
                          color: Tasmee3Colors.primary,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
          centerTitle: true,
          backgroundColor: Tasmee3Colors.background,
          foregroundColor: Tasmee3Colors.text,
          elevation: 0,
          actions: actions,
        ),
        floatingActionButton: floatingActionButton,
        bottomNavigationBar: bottomNavigationBar,
        body: SafeArea(child: body),
      ),
    );
  }
}
