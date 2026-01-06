<?php

namespace App\Controller\Api;

use App\Entity\StudentTest;
use App\Entity\User;
use App\Repository\TestRepository;
use App\Repository\SubjectRepository;
use App\Service\StudentGroupService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/student')]
class StudentController extends AbstractController
{
    public function __construct(
        private TestRepository $testRepo,
        private SubjectRepository $subjectRepo,
        private EntityManagerInterface $em
    ) {}

    // -------------------------------
    // GET ALL TESTS
    // -------------------------------
    #[Route('/tests', methods: ['GET'])]
    public function getTests(): JsonResponse
    {
        $tests = $this->testRepo->findAll();
        $data = [];

        foreach ($tests as $test) {
            $questions = $test->getQuestions()->map(fn($q) => [
                'id' => $q->getId(),
                'content' => $q->getContent(),
            ])->toArray();

            $data[] = [
                'id' => $test->getId(),
                'subject' => $test->getSubject()->getName(),
                'subject_id' => $test->getSubject()->getId(),
                'questions' => $questions,
                'passed' => false,
                'score' => null
            ];
        }

        return $this->json($data);
    }

    // -------------------------------
    // GET ALL SUBJECTS
    // -------------------------------
    #[Route('/subjects', methods: ['GET'])]
    public function getSubjects(): JsonResponse
    {
        $subjects = $this->subjectRepo->findAll();

        $data = array_map(fn($s) => [
            'id' => $s->getId(),
            'name' => $s->getName(),
            'image_url' => $s->getImageUrl()
        ], $subjects);

        return $this->json($data);
    }

    // -------------------------------
    // GET TEST BY ID
    // -------------------------------
    #[Route('/tests/pass/{testId}', methods: ['GET'])]
    public function getTest(int $testId): JsonResponse
    {
        $test = $this->testRepo->find($testId);
        if (!$test) {
            return $this->json(['error' => 'Test not found'], 404);
        }

        $questions = $test->getQuestions()->map(fn($q) => [
            'id' => $q->getId(),
            'content' => $q->getContent(),
        ])->toArray();

        return $this->json([
            'id' => $test->getId(),
            'subject' => $test->getSubject()->getName(),
            'questions' => $questions
        ]);
    }

    // -------------------------------
    // PASS A TEST (SAVE SCORE AND ASSIGN GROUP)
    // -------------------------------
    #[Route('/tests/pass/{testId}', methods: ['POST'])]
    public function passTest(
        int $testId,
        Request $request,
        StudentGroupService $groupService
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $studentId = $data['studentId'] ?? null;

        if (!$studentId) {
            return $this->json(['error' => 'Student ID missing'], 400);
        }

        $student = $this->em->getRepository(User::class)->find($studentId);
        $test = $this->testRepo->find($testId);

        if (!$student || !$test) {
            return $this->json(['error' => 'Student or test not found'], 404);
        }

        $score = count($test->getQuestions()); // Adjust if you have real answers
        $totalQuestions = count($test->getQuestions());
        $percentage = $totalQuestions > 0 ? ($score / $totalQuestions) * 100 : 0;

        // Save student test
        $studentTest = new StudentTest();
        $studentTest->setStudent($student)
                    ->setTest($test)
                    ->setScore($score);

        $this->em->persist($studentTest);
        $this->em->flush();

        // Assign student to group
        $group = $groupService->createOrAssignGroup($student, $test, $percentage);

        return $this->json([
            'success' => true,
            'score' => $score,
            'percentage' => $percentage,
            'group' => [
                'id' => $group->getId(),
                'name' => $group->getName(),
                'level' => $group->getLevel(),
                'subject' => $group->getSubject()->getName()
            ]
        ]);
    }

    // -------------------------------
    // GET COMPLETED TESTS
    // -------------------------------
    #[Route('/{studentId}/completed-tests', methods: ['GET'])]
    public function completedTests(int $studentId): JsonResponse
    {
        $student = $this->em->getRepository(User::class)->find($studentId);

        if (!$student) {
            return $this->json(['error' => 'Student not found'], 404);
        }

        $completedTests = $this->em
            ->getRepository(StudentTest::class)
            ->findBy(['student' => $student]);

        $data = [];
        foreach ($completedTests as $st) {
            $data[] = [
                'test_id' => $st->getTest()->getId(),
                'subject' => $st->getTest()->getSubject()->getName(),
                'score' => $st->getScore(),
            ];
        }

        return $this->json($data);
    }

    // -------------------------------
    // GET STUDENT GROUPS
    // -------------------------------
    #[Route('/{studentId}/groups', methods: ['GET'])]
    public function studentGroups(int $studentId): JsonResponse
    {
        $student = $this->em->getRepository(User::class)->find($studentId);

        if (!$student) {
            return $this->json(['error' => 'Student not found'], 404);
        }

        $groups = $student->getStudentGroups();

        $data = [];
        foreach ($groups as $group) {
            $data[] = [
                'id' => $group->getId(),
                'name' => $group->getName(),
                'level' => $group->getLevel(),
                'subject' => $group->getSubject()->getName(),
                'members' => $group->getStudents()->count()
            ];
        }

        return $this->json($data);
    }
}
