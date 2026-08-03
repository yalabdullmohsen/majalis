import 'package:flutter/material.dart';

import '../tasmee3_design_tokens.dart';

class Tasmee3AppScaffold extends StatelessWidget {
  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final Widget? bottomNavigationBar;

  const Tasmee3AppScaffold({
    super.key,
    required this.title,
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
          title: Text(title),
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
