import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CommentService } from './comment.service';
import { Comment } from '../models/comment.model';

const API = '/api';

const mockComment: Comment = {
  id: 1, commentableType: 'RunCase', commentableId: 10, userId: 2,
  content: 'Good test', createdAt: '2026-06-15T10:00:00Z', updatedAt: '2026-06-15T10:00:00Z',
  User: { id: 2, username: 'alice', email: 'alice@example.com' },
};

describe('CommentService', () => {
  let service: CommentService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CommentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('should be created', () => expect(service).toBeTruthy());

  it('getComments sends GET /comments with params', () => {
    service.getComments('RunCase', 10).subscribe(r => expect(r).toEqual([mockComment]));
    const req = http.expectOne(`${API}/comments?commentableType=RunCase&commentableId=10`);
    expect(req.request.method).toBe('GET');
    req.flush([mockComment]);
  });

  it('getComments passes viewUserId when provided', () => {
    service.getComments('RunCase', 10, 42).subscribe();
    const req = http.expectOne(`${API}/comments?commentableType=RunCase&commentableId=10&viewUserId=42`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('addComment sends POST /comments with params and body', () => {
    service.addComment('RunCase', 10, 'Hello').subscribe(r => expect(r).toEqual(mockComment));
    const req = http.expectOne(`${API}/comments?commentableType=RunCase&commentableId=10`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Hello' });
    req.flush(mockComment);
  });

  it('deleteComment sends DELETE /comments/:id', () => {
    service.deleteComment(1).subscribe();
    const req = http.expectOne(`${API}/comments/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
