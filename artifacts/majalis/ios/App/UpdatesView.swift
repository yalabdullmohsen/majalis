import SwiftUI

// 1. بنية البيانات القادمة من الموقع
struct UpdateItem: Identifiable, Decodable {
    let id: String
    let title: String
    let content: String
}

// 2. واجهة التطبيق
struct UpdatesView: View {
    @State private var items: [UpdateItem] = []
    @State private var isLoading = false
    
    // رابط الـ API الخاص بموقعك
    let apiURL = "https://majlisilm.com/api/updates"

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && items.isEmpty {
                    ProgressView("جاري جلب التحديثات...")
                } else if items.isEmpty {
                    ContentUnavailableView("لا توجد تحديثات حالية", systemImage: "tray")
                } else {
                    List(items) { item in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(item.title)
                                .font(.headline)
                            Text(item.content)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .refreshable {
                        await fetchUpdates()
                    }
                }
            }
            .navigationTitle("التحديثات الحية")
            .onAppear {
                Task {
                    await fetchUpdates()
                }
            }
        }
    }

    // 3. دالة الاتصال بالموقع
    func fetchUpdates() async {
        isLoading = true
        defer { isLoading = false }
        
        guard let url = URL(string: apiURL) else { return }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decodedData = try JSONDecoder().decode([UpdateItem].self, from: data)
            self.items = decodedData
        } catch {
            print("خطأ في الاتصال بالموقع: \(error.localizedDescription)")
        }
    }
}
