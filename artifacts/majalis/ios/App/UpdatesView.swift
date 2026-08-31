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
    @State private var loadError: String? = nil

    // رابط الـ API الخاص بموقعك
    let apiURL = "https://www.ssunnah.com/api/updates"

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && items.isEmpty {
                    ProgressView("جاري جلب التحديثات...")
                } else if let loadError, items.isEmpty {
                    ContentUnavailableView(
                        "تعذّر تحميل التحديثات",
                        systemImage: "wifi.exclamationmark",
                        description: Text(loadError)
                    )
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

    // 3. دالة الاتصال بالموقع — تفكّ JSON إلى بطاقات، لا تعرض النص الخام
    func fetchUpdates() async {
        isLoading = true
        defer { isLoading = false }

        guard let url = URL(string: apiURL) else {
            loadError = "رابط غير صالح"
            return
        }

        do {
            var request = URLRequest(url: url)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                throw URLError(.badServerResponse)
            }

            // إن عاد الخادم سلسلة JSON مزدوجة الترميز، نفّكها أولًا
            if let asString = String(data: data, encoding: .utf8)?
                .trimmingCharacters(in: .whitespacesAndNewlines),
               asString.first == "\"" {
                if let inner = try? JSONDecoder().decode(String.self, from: data),
                   let innerData = inner.data(using: .utf8) {
                    let decodedData = try JSONDecoder().decode([UpdateItem].self, from: innerData)
                    self.items = decodedData
                    self.loadError = nil
                    return
                }
            }

            let decodedData = try JSONDecoder().decode([UpdateItem].self, from: data)
            self.items = decodedData
            self.loadError = nil
        } catch {
            if items.isEmpty {
                loadError = "تحقق من الاتصال ثم أعد المحاولة"
            }
            print("خطأ في الاتصال بالموقع: \(error.localizedDescription)")
        }
    }
}
