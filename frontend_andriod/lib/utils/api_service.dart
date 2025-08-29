import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://betting-app-xh48.onrender.com';

  // User Login with Phone Number and Password
  Future<http.Response> userLoginWithPhone(String phoneNumber, String password) async {
    final url = Uri.parse('$baseUrl/api/user/login/phoneNumberAndPassword');
    return await http.post(url, body: {
      'phoneNumber': phoneNumber,
      'password': password,
    });
  }

  // User Login with Email and Password
  Future<http.Response> userLoginWithEmail(String email, String password) async {
    final url = Uri.parse('$baseUrl/api/user/login/emailAndPassword');
    return await http.post(url, body: {
      'email': email,
      'password': password,
    });
  }

  // User Login with Username and Password
  Future<http.Response> userLoginWithUsername(String username, String password) async {
    final url = Uri.parse('$baseUrl/api/user/login/usernameAndPassword');
    return await http.post(url, body: {
      'username': username,
      'password': password,
    });
  }

  // User Register
  Future<http.Response> registerUser({
    required String fullName,
    required String email,
    required String password,
    required String phoneNumber,
    required String username,
  }) async {
    final url = Uri.parse('$baseUrl/api/user/create');
    return await http.post(url, body: {
      'fullName': fullName,
      'email': email,
      'password': password,
      'phoneNumber': phoneNumber,
      'username': username,
    });
  }

  // Get User Profile Info
  Future<http.Response> getUserProfile(String token) async {
    final url = Uri.parse('$baseUrl/api/user/get/profile/info');
    return await http.get(url, headers: {
      'Authorization': 'Bearer $token',
    });
  }

  // Update User Profile
  Future<http.Response> updateUserProfile({
    required String token,
    required String fullName,
    required String phoneNumber,
    required String email,
    required String username,
  }) async {
    final url = Uri.parse('$baseUrl/api/user/update');
    return await http.patch(url, headers: {
      'Authorization': 'Bearer $token',
    }, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'username': username,
    });
  }

  // User Logout
  Future<http.Response> userLogout(String token) async {
    final url = Uri.parse('$baseUrl/api/user/logout');
    return await http.delete(url, headers: {
      'Authorization': 'Bearer $token',
    });
  }

  // ================== CLASS APIs ==================
  // Get Class List
  Future<http.Response> getClassList({int pageNumber = 1, int pageSize = 10, String? token}) async {
    final url = Uri.parse('$baseUrl/api/class/get/list?pageNumber=$pageNumber&pageSize=$pageSize');
    return await http.get(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {});
  }

  // Get Class By ID
  Future<http.Response> getClassById(String classID, {String? token}) async {
    final url = Uri.parse('$baseUrl/api/class/get/by/id?classID=$classID');
    return await http.get(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {});
  }

  // Create Class
  Future<http.Response> createClass({required String className, required String description, String? token}) async {
    final url = Uri.parse('$baseUrl/api/class/create');
    return await http.post(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'className': className,
      'description': description,
    });
  }

  // Update Class
  Future<http.Response> updateClass({required String classID, required String className, required String description, String? token}) async {
    final url = Uri.parse('$baseUrl/api/class/update');
    return await http.patch(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'classID': classID,
      'className': className,
      'description': description,
    });
  }

  // Delete Class
  Future<http.Response> deleteClass(String classID, {String? token}) async {
    final url = Uri.parse('$baseUrl/api/class/delete');
    return await http.delete(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'classID': classID,
    });
  }

  // ================== CLASS NUMBER APIs ==================
  // Get Class Number List
  Future<http.Response> getClassNumberList(String classID, {String? token}) async {
    final url = Uri.parse('$baseUrl/api/classNumber/get/all/class/number?classID=$classID');
    return await http.get(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {});
  }

  // Get Class Number By ID
  Future<http.Response> getClassNumberById(String classNumberID, {String? token}) async {
    final url = Uri.parse('$baseUrl/api/classNumber/get/by/id?classNumberID=$classNumberID');
    return await http.get(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {});
  }

  // Create Class Number
  Future<http.Response> createClassNumber({required String classID, required String number, String? token}) async {
    final url = Uri.parse('$baseUrl/api/classNumber/create');
    return await http.post(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'classID': classID,
      'number': number,
    });
  }

  // Update Class Number
  Future<http.Response> updateClassNumber({required String classNumberID, required String number, String? token}) async {
    final url = Uri.parse('$baseUrl/api/classNumber/update');
    return await http.patch(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'classNumberID': classNumberID,
      'number': number,
    });
  }

  // Delete Class Number
  Future<http.Response> deleteClassNumber(String classNumberID, {String? token}) async {
    final url = Uri.parse('$baseUrl/api/classNumber/delete');
    return await http.delete(url, headers: token != null ? {'Authorization': 'Bearer $token'} : {}, body: {
      'classNumberID': classNumberID,
    });
  }
  // ================== ADMIN APIs ==================
  // Admin Login with Phone Number and Password
  Future<http.Response> adminLoginWithPhone(String phoneNumber, String password) async {
    final url = Uri.parse('$baseUrl/api/admin/login/phoneNumberAndPassword');
    return await http.post(url, body: {
      'phoneNumber': phoneNumber,
      'password': password,
    });
  }

  // Admin Login with Email and Password
  Future<http.Response> adminLoginWithEmail(String email, String password) async {
    final url = Uri.parse('$baseUrl/api/admin/login/emailAndPassword');
    return await http.post(url, body: {
      'email': email,
      'password': password,
    });
  }

  // Admin Logout
  Future<http.Response> adminLogout(String token) async {
    final url = Uri.parse('$baseUrl/api/admin/logout');
    return await http.delete(url, headers: {'Authorization': 'Bearer $token'});
  }

  // Admin Update
  Future<http.Response> adminUpdate({required String token, required String fullName, required String phoneNumber, required String email}) async {
    final url = Uri.parse('$baseUrl/api/admin/update');
    return await http.patch(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
    });
  }

  // Get Agent List (Admin)
  Future<http.Response> getAdminAgentList({int pageNumber = 1, int pageSize = 10, required String token}) async {
    final url = Uri.parse('$baseUrl/api/admin/get/agent/list?pageNumber=$pageNumber&pageSize=$pageSize');
    return await http.get(url, headers: {'Authorization': 'Bearer $token'});
  }

  // Get User List (Admin)
  Future<http.Response> getAdminUserList({int pageNumber = 1, int pageSize = 10, required String token}) async {
    final url = Uri.parse('$baseUrl/api/admin/get/user/list?pageNumber=$pageNumber&pageSize=$pageSize');
    return await http.get(url, headers: {'Authorization': 'Bearer $token'});
  }

  // Create User (Admin)
  Future<http.Response> adminCreateUser({required String token, required String fullName, required String email, required String password, required String phoneNumber, required String username}) async {
    final url = Uri.parse('$baseUrl/api/admin/create/user');
    return await http.post(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'email': email,
      'password': password,
      'phoneNumber': phoneNumber,
      'username': username,
    });
  }

  // Update User (Admin)
  Future<http.Response> adminUpdateUser({required String token, required String fullName, required String phoneNumber, required String email, required String username, required String userID}) async {
    final url = Uri.parse('$baseUrl/api/admin/update/user');
    return await http.patch(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'username': username,
      'userID': userID,
    });
  }

  // Create Agent (Admin)
  Future<http.Response> adminCreateAgent({required String token, required String fullName, required String phoneNumber, required String email, required String password}) async {
    final url = Uri.parse('$baseUrl/api/admin/create/agent');
    return await http.post(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'password': password,
    });
  }

  // Update Agent (Admin)
  Future<http.Response> adminUpdateAgent({required String token, required String fullName, required String phoneNumber, required String email, required String agentID}) async {
    final url = Uri.parse('$baseUrl/api/admin/update/agent');
    return await http.patch(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'agentID': agentID,
    });
  }

  // Delete Agent (Admin)
  Future<http.Response> adminDeleteAgent({required String token, required String agentID}) async {
    final url = Uri.parse('$baseUrl/api/admin/delete/agent');
    return await http.delete(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'agentID': agentID,
    });
  }

  // Delete User (Admin)
  Future<http.Response> adminDeleteUser({required String token, required String userID}) async {
    final url = Uri.parse('$baseUrl/api/admin/delete/user');
    return await http.delete(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'userID': userID,
    });
  }

  // ================== AGENT APIs ==================
  // Agent Login with Phone Number and Password
  Future<http.Response> agentLoginWithPhone(String phoneNumber, String password) async {
    final url = Uri.parse('$baseUrl/api/agent/login/phoneNumberAndPassword');
    return await http.post(url, body: {
      'phoneNumber': phoneNumber,
      'password': password,
    });
  }

  // Agent Login with Email and Password
  Future<http.Response> agentLoginWithEmail(String email, String password) async {
    final url = Uri.parse('$baseUrl/api/agent/login/emailAndPassword');
    return await http.post(url, body: {
      'email': email,
      'password': password,
    });
  }

  // Agent Logout
  Future<http.Response> agentLogout(String token) async {
    final url = Uri.parse('$baseUrl/api/agent/logout');
    return await http.delete(url, headers: {'Authorization': 'Bearer $token'});
  }

  // Agent Update
  Future<http.Response> agentUpdate({required String token, required String fullName, required String phoneNumber, required String email}) async {
    final url = Uri.parse('$baseUrl/api/agent/update');
    return await http.patch(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
    });
  }

  // Get Agent Profile Info
  Future<http.Response> getAgentProfile(String token) async {
    final url = Uri.parse('$baseUrl/api/agent/get/profileInfo');
    return await http.get(url, headers: {'Authorization': 'Bearer $token'});
  }

  // Create User (Agent)
  Future<http.Response> agentCreateUser({required String token, required String fullName, required String email, required String password, required String phoneNumber, required String username}) async {
    final url = Uri.parse('$baseUrl/api/agent/create/user');
    return await http.post(url, headers: {'Authorization': 'Bearer $token'}, body: {
      'fullName': fullName,
      'email': email,
      'password': password,
      'phoneNumber': phoneNumber,
      'username': username,
    });
  }

  // Get User List (Agent)
  Future<http.Response> getAgentUserList({int pageNumber = 1, int pageSize = 10, required String token}) async {
    final url = Uri.parse('$baseUrl/api/agent/get/user/list?pageNumber=$pageNumber&pageSize=$pageSize');
    return await http.get(url, headers: {'Authorization': 'Bearer $token'});
  }
}
